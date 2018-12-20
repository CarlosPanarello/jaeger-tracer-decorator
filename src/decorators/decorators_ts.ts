import "reflect-metadata";
import { isFunction, isUndefined } from "util";
import * as ERROR_MSG from "../constants/error_msgs";
import * as METADATA_KEY from "../constants/metadata_key";
import { IMetadataTracer } from "../interfaces/interfaces";
import { jaegerClient, JaegerTracer } from "../tracer/jaeger.tracer";

const Tags = jaegerClient.opentracing.Tags;
const FORMAT_HTTP_HEADERS = jaegerClient.opentracing.FORMAT_HTTP_HEADERS;
/**
 * Decorator for use in Class and Methods.
 * It will create a Span for wich decorate method of the class, it will reflect the call stack.
 * If or class have another decorate traceable class, they have to be initialize inside constructor of main class,
 *  otherwise it will create a new branch of spans.
 *
 * @example
 * import { setTagSpan, traceable } from "jaeger-tracer-decorators";
 * @traceable()
 * class Example {
 *
 *   constructor() {
 *     console.log("My constructor");
 *   }
 *
 *   @traceable()
 *   public myMethod() {
 *     console.log("My Method");
 *   }
 * }
 */
export function traceable() {
  return (...args: any[]) => {
    args = args.filter((i) => !isUndefined(i));
    switch (args.length) {
      case 1:
        return TraceableClassDecorator(args[0]);
      case 3:
        if (typeof args[2] === "number") {
          throw new Error(ERROR_MSG.INVALID_LOCAL_TRACEABLE_DECORATOR);
        }
        return TraceableMethodDecorator(args[0], args[1], args[2]);
      default:
        throw new Error(ERROR_MSG.INVALID_LOCAL_TRACEABLE_DECORATOR);
    }
  };
}

export function TraceableClassDecorator<T extends { new(...args: any[]): object }>(target: T): T {
  return class InternalTracer extends target {
    constructor(...args: any[]) {
      super(...args);
      const className = target.name;
      const spanStack = new Array<any>();
      const data = { className, spanStack };
      Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, this);
    }
  };
}
/** Search Span in args of a class Method, span could be in req.jaegerSpan or headers */
function extractSpanFromArgs(tracer: any, spanName: string, ...args: any[]) {
  let span: any;
  /** Stop in the first occurrs JaegerSpan or headers from args */
  const hasSpanOrHeader = args[0].some((arg: any) => {
    if (arg && arg.jaegerSpan) {
      span = tracer.startSpan(spanName, { childOf: arg.jaegerSpan });
      return true;
    }
    if (arg && arg.headers && arg.path && arg.method) {
      const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, arg.headers);
      if (parentSpanContext.isValid) {
        span = tracer.startSpan(spanName, { childOf: parentSpanContext });
        span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_SERVER);
      } else {
        span = tracer.startSpan(spanName);
        const path = isFunction(arg.path) ? arg.path() : arg.path;
        span.setTag(Tags.HTTP_URL, path);
        span.setTag(Tags.HTTP_METHOD, arg.method);
        span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
      }
      return true;
    }
    return false;
  });
  if (!hasSpanOrHeader) {
    span = tracer.startSpan(spanName);
    span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
  }

  return span;
}

export function TraceableMethodDecorator(target: object, propertyKey: string, descriptor: PropertyDescriptor | undefined) {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
  }

  if (descriptor === undefined) {
    return descriptor;
  }
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    let internalSpan: any;
    let result: any;
    let spanName: string;

    const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, this);
    const tracer = Reflect.getMetadata(METADATA_KEY.GLOBAL_TRACER, JaegerTracer);
    if (!tracer) {
      throw new Error(ERROR_MSG.TRACER_NOT_INITIALIZE);
    }

    if (!data) {
      throw new Error(ERROR_MSG.CLASS_DONT_HAVE_DECORATOR);
    }
    spanName = data.className + "." + propertyKey;

    if (data.spanStack.length > 0 && data.spanStack[data.spanStack.length - 1]) {
      internalSpan = tracer.startSpan(spanName, { childOf: data.spanStack[data.spanStack.length - 1] });
    } else {
      internalSpan = extractSpanFromArgs(tracer, spanName, args);
    }

    /** Seach in propertys of the class looking for another traceable class to continue the trace. */
    Reflect.ownKeys(this).forEach((item: any) => {
      if (((this as any)[item]) instanceof Object && Reflect.hasMetadata(METADATA_KEY.CLASS_TRACER, (this as any)[item])) {
        /** Found the traceable class */
        const dataChild: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, (this as any)[item]);
        dataChild.spanStack.push(internalSpan);
      }
    });

    data.spanStack.push(internalSpan);
    Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, target);

    const finishSpan = () => {
      internalSpan.finish();
      data.spanStack.pop();
      Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, target);
    };
    /** Execute the method, if throws a error is necessary close span */
    try {
      result = originalMethod.apply(this, args);
      if (result instanceof Promise) {
        result.then(finishSpan).catch(finishSpan);
      } else {
        finishSpan();
      }
      return result;
    } catch (e) {
      finishSpan();
      throw e;
    }
  };
  return descriptor;
}

/**
 * Decorator for use in Property to set the property as a Tag in Jaeger Span
 * Every time you set a value to this property it will create a Tag inside of current Span
 * @param tagName optinal name for span tag, if have spaces, special caracters or undefined will get the property name.
 *
 * @example
 * import { setTagSpan, traceable } from "jaeger-tracer-decorators";
 *
 * @traceable()
 *
 *  class Example {
 *
 *   @setTagSpan("new_tag_name")
 *   private tag: any;
 *
 *   constructor() {
 *     console.log("My constructor");
 *   }
 *
 *   @traceable()
 *   public myMethod() {
 *     this.tag = "my tag content";
 *     console.log("My Method");
 *   }
 * }
 */

export const setTagSpan = (tagName?: string) => {
  return (target: any, key: string) => {
    let prop = target[key];
    /** Override the Property getter */
    const getter = () => {
      return prop;
    };
    /** Override the Property setter, using value to add a tag */
    const setter = (val: any) => {
      const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, target);
      if (data && data.spanStack.length > 0) {
        const span = data.spanStack[data.spanStack.length - 1];
        if (tagName && (new RegExp("^[a-z](?:_?[a-z0-9]+)*$", "i")).test(tagName)) {
          span.setTag(tagName, val);
        } else {
          span.setTag(key, val);
        }
      }
      prop = val;
    };
    /** Delete Original property and override the getter and setter */
    Reflect.deleteProperty(target, key);
    Reflect.defineProperty(target, key, {
      get: getter,
      set: setter,
    });
  };
};
/**
 * Decorator for use in Property, this property will be readonly
 * It will return a header of the current span
 * @example
 *
 * import { setTagSpan, traceable } from "jaeger-tracer-decorators";
 *
 * @traceable()
 * class Example {
 *
 *   @getHeaderSpan()
 *   private header: any;
 *
 *   constructor() {
 *     console.log("My constructor");
 *   }
 *
 *   @traceable()
 *   public myCallEndPointMethod() {
 *     // your current header with key
 *     const header = { "x-api-key": "myscret" };
 *     const opts = {
 *       // it will merge both Json in one where header will override the same property from mySpanHeader if they have the same name
 *       headers: {...this.mySpanHeader, ...header},
 *     };
 *     // example of http request
 *     httpRequest("http:traceable/endpoint",opts);
 *   }
 * }
 */
export const getHeaderSpan = () => {
  return (target: any, key: string) => {
    let prop = target[key];
    const getter = () => {
      const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, target);
      const tracer = Reflect.getMetadata(METADATA_KEY.GLOBAL_TRACER, JaegerTracer);

      if (data && data.spanStack.length > 0) {
        const header = {};
        const span = data.spanStack[data.spanStack.length - 1];
        tracer.inject(span, FORMAT_HTTP_HEADERS, header);
        prop = header;
      }
      return prop;
    };

    Reflect.deleteProperty(target, key);
    Reflect.defineProperty(target, key, {
      get: getter,
    });
  };
};
