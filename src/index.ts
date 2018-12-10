import { decorateClass, decorateMethod, decoratePropertyHeader, decoratePropertyTag } from "./decorators/decorators_js";
import { getHeaderSpan, setTagSpan, traceable } from "./decorators/decorators_ts";
import { EndpointForTracing, IJaegerOptions, RequestTags, TransformPathInSpanName } from "./interfaces/interfaces";
import { JaegerTracer } from "./tracer/jaeger.tracer";
import { middlewareTracer } from "./tracer/middleware.tracer";

export {
  middlewareTracer,
  JaegerTracer,
  RequestTags,
  EndpointForTracing,
  TransformPathInSpanName,
  IJaegerOptions,
  traceable,
  getHeaderSpan,
  setTagSpan,
  decorateClass,
  decoratePropertyHeader,
  decoratePropertyTag,
  decorateMethod,
 };
