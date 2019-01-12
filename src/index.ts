import { decorateClass, decorateMethod, decoratePropertyHeader, decoratePropertyTag } from "./decorators/decorators_js";
import { getHeaderSpan, setTagSpan, traceable } from "./decorators/decorators_ts";
import { EndpointForTracing, IJaegerOptions, IOptionsMiddleware, RequestTags, ResponseTags, TransformPathInSpanName } from "./interfaces/interfaces";
import { JaegerTracer } from "./tracer/jaeger.tracer";
import { middlewareTracer } from "./tracer/middleware.tracer";

export {
  middlewareTracer,
  JaegerTracer,
  RequestTags,
  ResponseTags,
  EndpointForTracing,
  TransformPathInSpanName,
  IJaegerOptions,
  IOptionsMiddleware,
  traceable,
  getHeaderSpan,
  setTagSpan,
  decorateClass,
  decoratePropertyHeader,
  decoratePropertyTag,
  decorateMethod,
 };
