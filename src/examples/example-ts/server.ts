import * as restify from "restify";
import { restifyMiddlewareTracer, TransformPathInSpanName } from "../../index";
import { EndpointForTracing, JaegerTracer, RequestTags  } from "../../index";
import { Controller } from "./controller";

const jaegerTracer = new JaegerTracer();

const endpointForTracing: EndpointForTracing = (path: string) => {
  return !path.startsWith("/ping");
};
const transformPathInSpanName: TransformPathInSpanName = (path: string) => {
  switch (true) {
    case path.startsWith("/fullname/son"):
      return "Get_Sons_FullName_API";
    case path.startsWith("/fullname/father"):
      return "Get_Fathers_FullName_API";
    default:
      return path;
  }
};

const requestTags: RequestTags[] = ["id", "headers"];

const server = restify.createServer({
  name: "Exemple Restify Server Typescript",
  version: process.env.npm_package_version ? process.env.npm_package_version : "0.0.0",
});

server.use(restifyMiddlewareTracer({
  jaegerTracer,
  endpointForTracing,
  transformPathInSpanName,
  requestTags,
}));

server.use(restify.plugins.queryParser());

server.use(restify.plugins.bodyParser());

server.get("/ping", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
  res.send("pong");
  next();
});

server.get("/fullname/son", async (req: any, resp: any, next: restify.Next) => {
  resp.send(new Controller().getSon(req));
});

server.get("/fullname/father", async (req: any, resp: any, next: restify.Next) => {
  resp.send(new Controller().getName(req));
});

server.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);
