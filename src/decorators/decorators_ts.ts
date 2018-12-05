import { FORMAT_HTTP_HEADERS, Tags } from "opentracing";
import "reflect-metadata";
import { isFunction } from "util";
import * as ERROR_MSG from "../constants/error_msgs";
import * as METADATA_KEY from "../constants/metadata_key";
import { IMetadataTracer } from "../interfaces/interfaces";
import { JaegerTracer, Logger } from "../tracer/jaeger.tracer";

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
    Logger.info(  "Tamanho das opcoes", args.length);
    switch (args.length) {
      case 1:
        return TraceableClassDecorator(args[0]);
      case 2:
        throw new Error(ERROR_MSG.INVALIDATE_LOCAL_TRACEABLE_DECORATOR);
      case 3:
        if (typeof args[2] === "number") {
          throw new Error(ERROR_MSG.INVALIDATE_LOCAL_TRACEABLE_DECORATOR);
        }
        return TraceableMethodDecorator(args[0], args[1], args[2]);
      default:
        throw new Error(ERROR_MSG.INVALIDATE_LOCAL_TRACEABLE_DECORATOR);
    }
  };
}

export function TraceableClassDecorator<T extends { new (...args: any[]): object }>(target: T): T {
  return class InternalTracer extends target {
      constructor(...args: any[]) {
        super(...args);
        const className = target.name;
        const spanStack = new Array<any>();
        const data = {className, spanStack};
        Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, this);
      }
  };
}
/** Search Span in args of a class Method, span could be in params.jaegerSpan or headers */
function extractSpanFromArgs(tracer: any, spanName: string, ...args: any[]) {
    let span: any;
    /** Stop in the first occurrs JaegerSpan or headers from args */
    Logger.info("Tamanho", args.length);
    const hasSpanOrHeader = args[0].some((arg: any) => {
      Logger.info("Arg", (arg));
      Logger.info("headers", (arg.headers));
      Logger.info("path", (arg.path));
      Logger.info("headers", (arg.headers));
      Logger.info("Params", (arg.params));

      if (arg && arg.params && arg.params.jaegerSpan) {
        Logger.info("JaegerSpan", (arg.params.jaegerSpan));
        Logger.info("Pegando o jaegerSpan e criando como filho");
        span = tracer.startSpan(spanName, { childOf: arg.params.jaegerSpan });
        return true;
      }
      if (arg && arg.headers && arg.path && arg.method) {
        Logger.info("Possui Header");
        const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, arg.headers);
        if (parentSpanContext.isValid) {
          Logger.info("Possui Header Valido");
          span = tracer.startSpan(spanName, {
            childOf: parentSpanContext,
            tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER },
          });
        } else {
          Logger.info("Possui Header InValido");
          span = tracer.startSpan(spanName);
          const path = isFunction(arg.path) ? arg.path() : arg.path ;
          span.setTag(Tags.HTTP_URL, path);
          span.setTag(Tags.HTTP_METHOD, arg.method);
          span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
        }
        return true;
      }
      return false;
    });
    if (!hasSpanOrHeader) {
      Logger.info("Nao Encontrou um Request, criando o primeiro SPAN");
      span = tracer.startSpan(spanName);
    }

    return span;
}

export function TraceableMethodDecorator(target: object, propertyKey: string, descriptor: PropertyDescriptor | undefined) {
  Logger.info(`method ${target.constructor.name + "." + propertyKey} decorator: begin`);
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

    Logger.info(`method ${this.constructor.name + "." + propertyKey} exe: begin`);
    const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, this);
    const tracer = Reflect.getMetadata(METADATA_KEY.GLOBAL_TRACER, JaegerTracer);
    if (!tracer) {
      throw new Error(ERROR_MSG.TRACER_NOT_INITIALIZE);
    }

    if (!data) {
      throw new Error(ERROR_MSG.CLASS_DONT_HAVE_DECORATOR);
    }
    spanName = data.className + "." + propertyKey;

    Logger.info("Tamanho do Stack", data.spanStack.length);

    if (data.spanStack.length > 0 && data.spanStack[data.spanStack.length - 1]) {
      Logger.info("Criando span como filho");
      internalSpan = tracer.startSpan(spanName, { childOf: data.spanStack[data.spanStack.length - 1] });
    } else {
      Logger.info("Nao Tem Span Pai");
      internalSpan = extractSpanFromArgs(tracer, spanName, args);
    }

    /** Seach in propertys of the class looking for another traceable class to continue the trace. */
    Reflect.ownKeys(this).forEach((item: any) => {
      Logger.info(typeof((this as any)[item]));
      if (((this as any)[item]) instanceof Object && Reflect.hasMetadata(METADATA_KEY.CLASS_TRACER, (this as any)[item]) ) {
        /** Found the traceable class */
        const dataChild: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, (this as any)[item]);
        dataChild.spanStack.push(internalSpan);
      }
    });

    data.spanStack.push(internalSpan);
    Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, target);

    const finishSpan = () => {
      Logger.info("Finalizando Span", spanName);
      if (internalSpan) {
        internalSpan.finish();
        data.spanStack.pop();
        Reflect.defineMetadata(METADATA_KEY.CLASS_TRACER, data, target);
      }
    };
    /** Execute the method, if throws a error is necessary close span */
    try {
      result = originalMethod.apply(this, args);
      if (result instanceof Promise) {
        result.then(finishSpan).catch(finishSpan);
      } else {
        finishSpan();
      }
      Logger.info(`method ${this.constructor.name + "." + propertyKey} exe: end`);
      return result;
    } catch (e) {
      Logger.info(`method ${this.constructor.name + "." + propertyKey} exe with error ${e}: end`);
      finishSpan();
      throw e;
    }
  };
  Logger.info(`method ${target.constructor.name + "." + propertyKey} decorator: end`);
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
    Logger.info("Start ############## --- setTagSpan --- ###################");

    let prop = target[key];

    /** Override the Property getter */
    const getter = () => {
      return prop;
    };
    /** Override the Property setter, using value to add a tag */
    const setter = (val: any) => {
      Logger.info("Setting value: ", val);
      Logger.info(`Antes Set: ${key} => ${prop}`);
      const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, target);
      Logger.info(`Data: ${data}`);
      if ( data && data.spanStack.length > 0 && data.spanStack[data.spanStack.length - 1]) {
        const span = data.spanStack[data.spanStack.length - 1];
        Logger.info(`Span: ${span}`);
        Logger.info(`Tag:(${key}, ${val})`);
        if (tagName && (new RegExp("^[a-z](?:_?[a-z0-9]+)*$", "i")).test(tagName)) {
          span.setTag(tagName, val);
        } else {
          span.setTag(key, val);
        }
      }
      prop = val;
      Logger.info(`Depois Set: ${key} => ${prop}`);
    };
    /** Delete Original property and override the getter and setter */
    if (Reflect.deleteProperty(target, key)) {
      Reflect.defineProperty(target, key, {
        get: getter,
        set: setter,
      });
    }
    Logger.info("End ############## --- setTagSpan --- ###################");
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
    Logger.info("Start ############## --- getHeaderSpan --- ###################");
    // property value
    let prop = target[key];

    // property getter
    const getter = () => {
      Logger.info(`Antes Get: ${key} => ${prop}`);
      const data: IMetadataTracer = Reflect.getMetadata(METADATA_KEY.CLASS_TRACER, target);
      const tracer = Reflect.getMetadata(METADATA_KEY.GLOBAL_TRACER, JaegerTracer);

      if (!tracer) {
        throw new Error(ERROR_MSG.TRACER_NOT_INITIALIZE);
      }

      Logger.info(`Data: ${data}`);
      if ( data && data.spanStack.length > 0 && data.spanStack[data.spanStack.length - 1]) {
        const header: any = {};
        const span = data.spanStack[data.spanStack.length - 1];
        Logger.info(`Span: ${span}`);
        tracer.inject(span, FORMAT_HTTP_HEADERS, header);
        Logger.info(`Header: ${header}`);
        if (header) {
          prop = header;
        }
      }
      Logger.info(`Depois Get: ${key} => ${prop}`);
      return prop;
    };

    if (Reflect.deleteProperty(target, key)) {
      Reflect.defineProperty(target, key, {
        get: getter,
      });
    }
    Logger.info("End ############## --- getHeaderSpan --- ###################");
  };
};
