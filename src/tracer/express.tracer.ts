import * as express from "express";
import { FORMAT_HTTP_HEADERS, Tags } from "opentracing";
import "reflect-metadata";
import { defaultTransformPathInSpanName, IOptionsMiddlewareExpress, RequestTags } from "../interfaces/interfaces";

/**
 * Middleware for express server, if request have a span in request header it will create a child span from it.
 * If span doesn't exist will create a new one. The span is in req.param.jaegerSpan
 * In finish or close event will finish the span created.
 *
 * If you want send a span to another service you can add req.param.jaegarHeader in your header request.
 * @param options.requestTags array of values of request "query","body","headers","id","params","username" to create a tag.
 * @param options.transformPathInSpanName: function to transform path in span name, default is path to be span name.
 */
export const expressMiddlewareTracer = (options: IOptionsMiddlewareExpress): express.RequestHandler => {
  const requestTags = options.requestTags ? options.requestTags : new Array<RequestTags>();
  const transformPathInSpanName = options.transformPathInSpanName ? options.transformPathInSpanName : defaultTransformPathInSpanName;

  return (req: express.Request, resp: express.Response, next: express.NextFunction) => {
    const parentSpanContext = options.jaegerTracer.tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    let span: any;
    const spanName = transformPathInSpanName(req.path);
    if (parentSpanContext.isValid) {
      span = options.jaegerTracer.tracer.startSpan(spanName, {
        childOf: parentSpanContext,
        tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER },
      });
    } else {
      span = options.jaegerTracer.tracer.startSpan(spanName);

      span.setTag(Tags.HTTP_URL, req.path);
      span.setTag(Tags.HTTP_METHOD, req.method);
      span.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT);
    }
    const header: any = {};
    options.jaegerTracer.tracer.inject(span, FORMAT_HTTP_HEADERS, header);

    requestTags.forEach((item) => span.setTag(item, JSON.stringify((req as any)[item])));

    req.params.jaegerSpan = span;
    req.params.jaegerHeader = header;

    const finish = () => {
      if (span) {
        span.finish();
      }
    };
    resp.on("finish", finish);
    resp.on("close", finish);

    return next();
  };
};
