import * as express from "express";
import * as restify from "restify";
import { JaegerTracer } from "../tracer/jaeger.tracer";
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
 * List of possible itens to be add as Tag in span in the middleware.
 * You can add query, body, headers, id, param , username as span tags.
 */
export type RequestTags = "query" |"body" | "headers" | "id" | "params" | "username";

export const defaultEndpointForTracing = (path: string): boolean => true;
export const defaultTransformPathInSpanName = (path: string): string => path;

export interface IOptionsMiddlewareRestify {
  jaegerTracer: JaegerTracer;
  requestTags?: RequestTags[];
  endpointForTracing?: EndpointForTracing;
  transformPathInSpanName?: TransformPathInSpanName;
}

export interface IOptionsMiddlewareExpress {
  jaegerTracer: JaegerTracer;
  requestTags?: RequestTags[];
  endpointForTracing?: EndpointForTracing;
  transformPathInSpanName?: TransformPathInSpanName;
}
export interface IServerTracer {

  /**
   * Function for filter the endpoints in middleware that will be tracing.
   * @param path string with path of request
   * @returns true or false for tracing path.
   */
  endpointForTracing: EndpointForTracing;
  /**
   * Function for transform path name in span name, by default will get the path name.
   * @param path string with path of request
   * @returns string with name for using in span.
   */
  transformPathInSpanName: TransformPathInSpanName;
  /**
   * Adds a middleware for the server to create the first span or continue one from header request.
   * @param server server where middleware were will be add.
   * @param requestTags optional, list of tags that will be add as span tag.
   */
  addTracerMiddleware(server: restify.Server | express.Application, requestTags?: RequestTags[]): void;
}
