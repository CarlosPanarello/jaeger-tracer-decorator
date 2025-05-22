import * as METADATA_KEY from "../constants/metadata_key";
import { IJaegerOptions } from "../index.js";

// tslint:disable-next-line:no-var-requires
export const jaegerClient = require("jaeger-client");

const defaultNoLogger = {
  info: Function(),
  error: Function(),
};

const defaultOptions = (serviceName: string, version: string, prometheus?: any, logger?: any) => {

  if (!logger) {
    logger = defaultNoLogger;
  }

  const options = {
    tags: {},
    logger,
    metrics: {}
  };

  if (prometheus) {
    const promFactory = jaegerClient.PrometheusMetricsFactory;
    options.metrics = new promFactory(prometheus, serviceName);
  } else {
    options.metrics = {};
  }

  if (version.trim().length > 0) {
    Object.defineProperty(options.tags, serviceName, {
      value: { version },
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return options;
};
/**
 * Class to create and hold a jaeger tracer.
 */
export class JaegerTracer {
  public tracer: any;
  /**
   * Create Tracer
   * @param prometheus optional for add jaeger metrics to your metics.
   * @param logger optional for add jaeger logger to your logger.
   * @param options optional if is not inform it will get the options from enviroment.
   */
  constructor(prometheus?: any, logger?: any, options?: IJaegerOptions) {
    this.tracer = this.createNewTracer(prometheus, logger, options);
  }

  /**
   * Create a new Tracer
   * @param prometheus optional for add jaeger metrics to your metics.
   * @param logger optional for add jaeger logger to your logger.
   * @param options optional if is not inform it will get the options from enviroment.
   */
  public createNewTracer(prometheus?: any, logger?: any, options?: IJaegerOptions): any  {
    if (options) {
      this.tracer = jaegerClient.initTracer(options, defaultOptions(options.serviceName, options.serviceVersion,  prometheus, logger));
    } else {
      const serviceName = process.env.JAEGER_SERVICE_NAME ? process.env.JAEGER_SERVICE_NAME : "default_service_name";
      process.env.JAEGER_SERVICE_NAME = serviceName;
      const version = process.env.JAEGER_SERVICE_VERSION || "";
      this.tracer = jaegerClient.initTracerFromEnv({}, defaultOptions(serviceName, version,  prometheus, logger));
    }
    Reflect.defineMetadata(METADATA_KEY.GLOBAL_TRACER, this.tracer, JaegerTracer);
    return this.tracer;
  }
}
