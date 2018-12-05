import "reflect-metadata";
import { DESIGN_TYPES } from "../constants/metadata_key";
import { getHeaderSpan, setTagSpan, TraceableClassDecorator, TraceableMethodDecorator } from "./decorators_ts";
/**
 * Function to get parent prototype from object
 *
 * @param target object
 */
function getParentPrototype(target: any): any {
    const proto = Object.getPrototypeOf(target);
    const functionPrototype = Object.getPrototypeOf(Function);
    if (typeof target !== "function" || target === functionPrototype) {
        return  proto;
    }
    if (proto !== functionPrototype) {
        return  proto;
    }
    const prototype = target.prototype;
    const prototypeProto = prototype && Object.getPrototypeOf(prototype);
    if (prototypeProto === undefined || prototypeProto === Object.prototype) {
        return proto;
    }
    // If the constructor was not a function, then we cannot determine the heritage.
    const constructor = prototypeProto.constructor;
    if (typeof constructor !== "function") {
        return proto;
    }
    // If we have some kind of self-reference, then we cannot determine the heritage.
    if (constructor === target) {
        return proto;
    }
    return constructor;
}
/**
 * Function copied from typescript create after run tsc.
 *
 * @param args args
 */
function decoratorJs(...args: any[]) {
    const decorators = args[0];
    const target = args[1];
    let key: any;
    let desc: any;
    if (args.length > 2) {
        key = args[2];
    }
    if (args.length > 3) {
        desc = args[3];
    }
    const c = arguments.length;
    let r;
    let d;

    if (c < 3) {
        r = target;
    } else {
        if (!desc) {
            desc = Object.getOwnPropertyDescriptor(target, key);
        }
        r = desc;
    }

    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for (let i = decorators.length - 1; i >= 0; i--) {
            d = decorators[i];
            if (d) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }

    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

/**
 * Decorator for use in Property to set the property as a Tag in Jaeger Span.
 *
 * Every time you set a value to this property it will create a Tag inside of current Span.
 *
 * @param target class of the property.
 * @param propertyName name of property that will be use to create a tag in current span, by default it will be the tag name.
 * @param nameTag optinal name for span tag, if have spaces, special caracters or undefined will get the property name.
 * @example
 *
 *     var decorators = require("jaeger-tracer-decorators").decorators;
 *
 *     class Example {
 *       myExampleMethod(){
 *          this.tag = "My tag!";
 *          console.log("My method");
 *       }
 *     }
 *
 *     Example = decorators.decorateClass(Example);
 *     decorators.decorateMethod(Example, "myExampleMethod");
 *     decorators.decoratePropertyTag(Parent, "tag", "new_tag_name");
 *
 */
function decoratePropertyTag(target: any, propertyName: string, nameTag?: string): any {
    return decoratorJs([setTagSpan(nameTag), Reflect.metadata(DESIGN_TYPES, Object)], target.prototype, propertyName, void 0);
}

/**
 * Decorator for use in Property, this property will be readonly.
 *
 * It will return a header of the current span.
 *
 * @param target class of the property.
 * @param propertyName name that will be use to get a header for current span.
 * @example
 *
 *     var decorators = require("jaeger-tracer-decorators").decorators;
 *
 *     class Example {
 *       myCallEndPointMethod(){
 *          // your current header with some key
 *          const header = { "x-api-key": "myscret" };
 *          const opts = {
 *             // it will merge both Json in one where header will override the same property from mySpanHeader if they have the same name
 *             headers: {...this.mySpanHeader, ...header},
 *          };
 *          // example of http request
 *          httpRequest("http:traceable/endpoint",opts);
 *       }
 *     }
 *
 *     Example = decorators.decorateClass(Example);
 *     decorators.decorateMethod(Example, "myCallEndPointMethod");
 *     decorators.decoratePropertyHeader(Parent, "mySpanHeader",);
 *
 */
function decoratePropertyHeader(target: any, propertyName: string): any {
    return decoratorJs([getHeaderSpan(), Reflect.metadata(DESIGN_TYPES, Object)], target.prototype, propertyName, void 0);
}

/**
 * Decorator for use in Class Methods only.
 *
 * It will use span stack created in the class decorator.
 *
 * The class have to be decorate too with decorateClass.
 *
 * @param target class of the method.
 * @param methodName name of the method of the class that you want to trace.
 * @example
 *
 *     var decorators = require("jaeger-tracer-decorators").decorators;
 *
 *     class Example {
 *       myExampleMethod(){
 *         console.log("My method");
 *       }
 *     }
 *
 *     Example = decorators.decorateClass(Example);
 *     decorators.decorateMethod(Example, "myExampleMethod");
 *
 */
function decorateMethod(target: any, methodName: string): any {
    const targetFather = getParentPrototype(target.prototype);
    Object.defineProperty(target.prototype, methodName, Reflect.decorate([TraceableMethodDecorator as MethodDecorator], targetFather, methodName));
}
/**
 * Decorator for use in Classes only.
 *
 * It will create span stack for tracing nested method calls.
 *
 * If or class have another decorate traceable class, they have to be initialize inside constructor of main class, otherwise it will create a new branch of spans.
 * @param target class that you want to trace
 * @returns a class that you will for tracing .
 * @example
 *
 *     var decorators = require("jaeger-tracer-decorators").decorators;
 *
 *     class Example {
 *     }
 *
 *     Example = decorators.decorateClass(Example);
 *
 */
function decorateClass(target: any): any {
    return Reflect.decorate([TraceableClassDecorator as ClassDecorator], target);
}

export {
    decorateClass,
    decorateMethod,
    decoratePropertyTag,
    decoratePropertyHeader};
