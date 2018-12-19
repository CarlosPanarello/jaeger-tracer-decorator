import "reflect-metadata";
import { isFunction, isObject } from "util";
import { defaultEndpointForTracing, defaultTransformPathInSpanName } from "../interfaces/interfaces";
import { IOptionsMiddleware, RequestTags } from "../interfaces/interfaces";
import { jaegerClient } from "./jaeger.tracer";

const Tags = jaegerClient.opentracing.Tags;
const FORMAT_HTTP_HEADERS = jaegerClient.opentracing.FORMAT_HTTP_HEADERS;
/**
 * Middleware for restify or express server, if request have a span in request header it will create a child span from it.
 * If span doesn't exist will create a new one. The span is in req.param.jaegerSpan
 * In finish or close event will finish the span created.
 *
 * If you want send a span to another service you can add req.param.jaegarHeader in your header request.
 * @param options.tracer tracer that you can obtain by calling Jaeger.tracer.
 * @param options.requestTags array of values of request "query","body","headers","id","params","username" to create a tag.
 * @param options.endpointForTracing function to filter which path do you want to trace, default is a function that return true.
 * @param options.transformPathInSpanName: function to transform path in span name, default is path to be span name.
 */
export const middlewareTracer = (options: IOptionsMiddleware): any => {
  const requestTags = options.requestTags ? options.requestTags : new Array<RequestTags>();
  const endpointForTracing = options.endpointForTracing ? options.endpointForTracing : defaultEndpointForTracing;
  const transformPathInSpanName = options.transformPathInSpanName ? options.transformPathInSpanName : defaultTransformPathInSpanName;

  return (req: any, resp: any, next: any) => {
    const path = isFunction(req.path) ? req.path() : req.path;
    const url = isFunction(req.absoluteUri) ? req.absoluteUri(path) : req.url;
    if (endpointForTracing(path)) {
      const parentSpanContext = options.tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
      let span: any;
      const spanName = transformPathInSpanName(path);
      if (parentSpanContext.isValid) {
        span = options.tracer.startSpan(spanName, { childOf: parentSpanContext });
        span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_SERVER);
      } else {
        span = options.tracer.startSpan(spanName);
        span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
      }
      const header = {};
      options.tracer.inject(span, FORMAT_HTTP_HEADERS, header);
      span.setTag(Tags.HTTP_URL, url);
      span.setTag(Tags.HTTP_METHOD, req.method);

      requestTags.forEach((item) => {
        let resultOfProperty = req[item];
        if (isFunction(req[item]) ) {
          resultOfProperty = req[item]();
        }
        if (isObject(resultOfProperty)) {
          resultOfProperty = Object.assign({}, resultOfProperty);
        }
        span.setTag(item , resultOfProperty);
      });

      req.jaegerSpan = span;
      req.jaegerHeader = header;

      const finish = () => {
        span.finish();
      };
      resp.on("finish", finish);
      resp.on("close", finish);
    }
    next();
  };
};
