import * as express from "express";
import { expressMiddlewareTracer, TransformPathInSpanName } from "../../index";
import { EndpointForTracing, JaegerTracer, RequestTags  } from "../../index";
import { Controller } from "./controller";

const jaegerTracer = new JaegerTracer();
const requestTags: RequestTags[] = ["query", "headers"];
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

const server = express();

/* If you want to add id in each request
import uuidv4 = require("uuid/v4");
server.use((req: any, res: express.Response, next: express.NextFunction) => {
  req.id = uuidv4();
  next();
});
*/

server.get("/ping",
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.send("pong");
  next();
});

server.get("/fullname/son",
expressMiddlewareTracer({jaegerTracer, requestTags, transformPathInSpanName }),
  async (req: express.Request, res: express.Response, next: express.NextFunction)  => {
  res.send(new Controller().getSon(req));
});

server.get("/fullname/father",
expressMiddlewareTracer({jaegerTracer, requestTags, transformPathInSpanName }),
async (req: express.Request, res: express.Response, next: express.NextFunction)  => {
  res.send(new Controller().getName(req));
});

server.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);
