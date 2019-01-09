export interface IMetadataTracer {
  arg: any;
  className: string;
  spanStack: any[];
}

/**
 * Function for filter the endpoints in middleware that will be tracing.
 * @param path string with path of request
 * @returns true or false for tracing path.
 */
export type EndpointForTracing = (path: string) => boolean;
/**
 * Function for transform path name in span name, by default will get the path name.
 * @param path string with path of request
 * @returns string with name for using in span.
 */
export type TransformPathInSpanName = (path: string) => string;
/**
 * List of possible request property to be add as Tag in span in the middleware.
 * You can add query, body, headers, id, param , username, route as span tags.
 */
export type RequestTags = "query" |"body" | "headers" | "id" | "params" | "username" | "route";

/**
 * List of possible response property to be add as Tag in span in the middleware.
 * You can add statusCode.
 */
export type ResponseTags = "statusCode";

export const defaultEndpointForTracing = (path: string): boolean => true;
export const defaultTransformPathInSpanName = (path: string): string => path;

export interface IJaegerOptions {
  serviceName: string;
  serviceVersion: string;
  disable: boolean;
  sampler?: {
    type: "const" | "remote" | "probabilistic" | "ratelimiting";
    param: number ;
    host?: string;
    port?: number;
    refreshIntervalMs?: number;
  };
  reporter?: {
    logSpans: boolean;
    agentHost: string ;
    agentPort: number ;
    flushIntervalMs?: number;
  };
  throttler?: {
    host: string ;
    port: number ;
    refreshIntervalMs?: number;
  };
}
export interface IOptionsMiddleware {
  tracer: any;
  requestTags?: RequestTags[];
  responseTags?: ResponseTags[];
  endpointForTracing?: EndpointForTracing;
  transformPathInSpanName?: TransformPathInSpanName;
}
