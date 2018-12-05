import { isNumber } from "util";
import * as METADATA_KEY from "../constants/metadata_key";

const defaultConfig = {
  serviceName: process.env.JAEGER_SERVICE_NAME || "default_service_name",
  version: process.env.JAEGER_SERVICE_VERSION || process.env.npm_package_version || "0.0.0",
  sampler: {
    type: process.env.JAEGER_SAMPLER_TYPE || "remote",
    param: process.env.JAEGER_SAMPLER_PARAM ? Number(process.env.JAEGER_SAMPLER_PARAM) : 1,
  },
  reporter: {
    logSpans: process.env.JAEGER_REPORTER_LOG_SPANS ? Boolean(process.env.JAEGER_REPORTER_LOG_SPANS) : true,
    agentHost: process.env.JAEGER_AGENT_HOST || "localhost",
    agentPort: isNumber(process.env.JAEGER_AGENT_PORT) ? Number(process.env.JAEGER_AGENT_PORT) : 6832,
  },
};

const defaultConsoleLogger = {
  info: (info: any) => console.log(info),
  error: (error: any) => console.log(error),
};

const defaultNoLogger = {
  info: Function(),
  error: Function(),
};

export const Logger = process.env.NODE_ENV === "development" ? defaultConsoleLogger : defaultNoLogger;

const defaultOptions = (prometheus?: any, logger?: any) => {

  if (!logger) {
    logger = Logger;
   }

  const options = {
    tags: {},
    logger,
    metrics: {},
  };

  if (prometheus) {
    const promFactory = require("jaeger-client").PrometheusMetricsFactory;
    options.metrics = new promFactory(prometheus, defaultConfig.serviceName);
  } else {
    delete options.metrics;
  }

  if (defaultConfig.version) {
    Object.defineProperty(options.tags, defaultConfig.serviceName, {
      value: { version: defaultConfig.version },
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return options;
};
/**
 * Class to hold a tracer
 */
export class JaegerTracer {
  public tracer: any;

  constructor(prometheus?: any, logger?: any) {
    this.createNewTracer(prometheus, logger);
  }

  /**
   * Create a new Tracer
   * @param prometheus optional for add jaeger metrics to your metics.
   * @param logger optional for add jaeger logger to your logger.
   */
  public createNewTracer(prometheus?: any, logger?: any) {
    this.tracer = require("jaeger-client").initTracer(defaultConfig, defaultOptions(prometheus, logger));
    Reflect.defineMetadata(METADATA_KEY.GLOBAL_TRACER, this.tracer, JaegerTracer);
  }
}
