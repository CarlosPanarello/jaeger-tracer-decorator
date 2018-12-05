import { decorateClass, decorateMethod, decoratePropertyHeader, decoratePropertyTag } from "./decorators/decorators_js";
import { getHeaderSpan, setTagSpan, traceable } from "./decorators/decorators_ts";
import { EndpointForTracing, RequestTags, TransformPathInSpanName } from "./interfaces/interfaces";
import { expressMiddlewareTracer } from "./tracer/express.tracer";
import { JaegerTracer } from "./tracer/jaeger.tracer";
import { restifyMiddlewareTracer } from "./tracer/restify.tracer";

export {
  expressMiddlewareTracer,
  restifyMiddlewareTracer,
  JaegerTracer,
  RequestTags,
  EndpointForTracing,
  TransformPathInSpanName,
  traceable,
  getHeaderSpan,
  setTagSpan,
  decorateClass,
  decoratePropertyHeader,
  decoratePropertyTag,
  decorateMethod,
 };
