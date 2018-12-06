import { FORMAT_HTTP_HEADERS, Tags } from "opentracing";
import "reflect-metadata";
import * as restify from "restify";
import { isFunction, isObject } from "util";
import { defaultEndpointForTracing, defaultTransformPathInSpanName } from "../interfaces/interfaces";
import { IOptionsMiddlewareRestify, RequestTags } from "../interfaces/interfaces";

/**
 * Middleware for restify server, if request have a span in request header it will create a child span from it.
 * If span doesn't exist will create a new one. The span is in req.param.jaegerSpan
 * In finish or close event will finish the span created.
 *
 * If you want send a span to another service you can add req.param.jaegarHeader in your header request.
 * @param options.requestTags array of values of request "query","body","headers","id","params","username" to create a tag.
 * @param options.endpointForTracing function to filter which path do you want to trace, default is a function that return true.
 * @param options.transformPathInSpanName: function to transform path in span name, default is path to be span name.
 */
export const restifyMiddlewareTracer = (options: IOptionsMiddlewareRestify): restify.RequestHandler => {
  const requestTags = options.requestTags ? options.requestTags : new Array<RequestTags>();
  const endpointForTracing = options.endpointForTracing ? options.endpointForTracing : defaultEndpointForTracing;
  const transformPathInSpanName = options.transformPathInSpanName ? options.transformPathInSpanName : defaultTransformPathInSpanName;

  return (req: restify.Request, resp: restify.Response, next: restify.Next) => {
    if (endpointForTracing(req.path())) {
      const parentSpanContext = options.jaegerTracer.tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
      let span: any;
      const spanName = transformPathInSpanName(req.path());
      if (parentSpanContext.isValid) {
        span = options.jaegerTracer.tracer.startSpan(spanName, { childOf: parentSpanContext });
      } else {
        span = options.jaegerTracer.tracer.startSpan(spanName);
      }
      const header = {};
      options.jaegerTracer.tracer.inject(span, FORMAT_HTTP_HEADERS, header);
      span.setTag(Tags.HTTP_URL, req.absoluteUri(req.path()));
      span.setTag(Tags.HTTP_METHOD, req.method);
      span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_SERVER);

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

      req.params.jaegerSpan = span;
      req.params.jaegerHeader = header;

      const finish = () => {
        if (span) {
          span.finish();
        }
      };
      resp.on("finish", finish);
      resp.on("close", finish);
    }
    return next();
  };
};
