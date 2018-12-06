# jaeger-tracer-decorator

Decorators for tracing, and middlewares functions for express and restify.

## Installation

You can install `jaeger-tracer-decorator` using npm:

```sh
npm install jaeger-tracer-decorator --save
```

## Environment variables

You can use the same enviroment variables from Jaeger.

The tracer can be initialized with values coming from environment variables. None of the env vars are required and all of them can be overridden via direct setting of the property on the configuration object.
You can get more info in [Jaeger Client Node](https://github.com/jaegertracing/jaeger-client-node)

| Property                         | Description                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JAEGER_SERVICE_NAME              | The service name                                                                                                                                                                                                                                                                                                 |
| JAEGER_SERVICE_VERSION           | The service version                                                                                                                                                                                                                                                                                              |
| JAEGER_AGENT_HOST                | The hostname for communicating with agent via UDP                                                                                                                                                                                                                                                                |
| JAEGER_AGENT_PORT                | The port for communicating with agent via UDP                                                                                                                                                                                                                                                                    |
| JAEGER_ENDPOINT                  | The HTTP endpoint for sending spans directly to a collector, i.e. http://jaeger-collector:14268/api/traces                                                                                                                                                                                                       |
| JAEGER_USER                      | Username to send as part of "Basic" authentication to the collector endpoint                                                                                                                                                                                                                                     |
| JAEGER_PASSWORD                  | Password to send as part of "Basic" authentication to the collector endpoint                                                                                                                                                                                                                                     |
| JAEGER_REPORTER_LOG_SPANS        | Whether the reporter should also log the spans                                                                                                                                                                                                                                                                   |
| JAEGER_REPORTER_FLUSH_INTERVAL   | The reporter's flush interval (ms)                                                                                                                                                                                                                                                                               |
| JAEGER_SAMPLER_TYPE              | The sampler type                                                                                                                                                                                                                                                                                                 |
| JAEGER_SAMPLER_PARAM             | The sampler parameter (number)                                                                                                                                                                                                                                                                                   |
| JAEGER_SAMPLER_MANAGER_HOST_PORT | The HTTP endpoint when using the remote sampler, i.e. http://jaeger-agent:5778/sampling                                                                                                                                                                                                                          |
| JAEGER_SAMPLER_REFRESH_INTERVAL  | How often the remotely controlled sampler will poll jaeger-agent for the appropriate sampling strategy                                                                                                                                                                                                           |
| JAEGER_TAGS                      | A comma separated list of `name = value` tracer level tags, which get added to all reported spans. The value can also refer to an environment variable using the format `${envVarName:default}`, where the `:default` is optional, and identifies a value to be used if the environment variable cannot be found |
| JAEGER_DISABLED                  | Whether the tracer is disabled or not. If true, the default `opentracing.NoopTracer` is used.                                                                                                                                                                                                                    |

## The Basics

For tracing your applictions you need to fill some requeriments

* Tracing work only with classes and middleware.
* For nested tracings, classes have to be instanced in the constructor of the main class.
* To use midlleware a instance of JaegerTracer is needed.

You can instrumentalize the server, restify or express, adding the restify or express middleware.
The middleware will create a span if request header has a tracer id, the span created will son of it.
You can recover span created in req.param.jaegerSpan.
The middleware will create a header from span created, and it is accessible in req.param.jaegerHeader.
Use JaegerTracer to create a new tracer, is optinal to pass metric and logger.
For middleware you need JaegerTracer instance, and the other params are optionals. RequestTags is an array of request fields that you can choose for adding in span tag, the other two are functions one to filter endpoints for trancing in middleware and other to transform path in span names.

* Restify

```ts
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
  resp.send(new Controller().getName());
});

server.get("/fullname/father", async (req: any, resp: any, next: restify.Next) => {
  resp.send(new Controller().getSon());
});

server.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);

```

* Express

```ts
import * as bodyParser from "body-parser";
import * as express from "express";
import uuidv4 = require("uuid/v4");
import { expressMiddlewareTracer, TransformPathInSpanName } from "../../index";
import { JaegerTracer, RequestTags  } from "../../index";
import { Controller } from "./controller";

const server = express();

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

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use((req: any, res: express.Response, next: express.NextFunction) => {
  req.id = uuidv4();
  next();
});

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

```

## Decorators

### Decorate your Classes

Insert a @traceable() decorator before class

### Decorate your Methods

Insert a @traceable() decorator before class method, the class have to be decorate with @traceable() too.

### Decorate your Property for create Span Tag

You can add some tags for tracings spans, just add @setTagSpan() before the property that you want to add as Tag in the current span.
By default the tag's name is the same as the property, but you can change passing the new name between ().
The name doesn't work with spaces or special caracters.

### Decorate your Property to get a Span Header

If you need to continue the tracer in another endpoint is import to send the tracer id in the header of http request.
For this you can add @getHeaderSpan in property, this property will become readonly and will return the header with the current span.

* Typescript

```ts
import Axios from "axios";
import https = require("https");
import { getHeaderSpan, setTagSpan, traceable  } from "../../decorators/decorators_ts";
import { Child } from "./child";

@traceable()
export class Parent {

  @getHeaderSpan()
  private mygetHeaderSpan: any;

  @setTagSpan()
  private myTag: any;

  @setTagSpan("full_name_son")
  private myOtherTag: any;

  private child: Child;

  private fullName: string;

  constructor(first: string, last: string) {
    this.child = new Child(last, "Bart");
    this.fullName = first + " " + last;
  }

  @traceable()
  public sayYourSonFullName(): string {
    this.myOtherTag = this.child.sayMyFullName();
    return this.myOtherTag;
  }

  @traceable()
  public sayYourFullName(): string {
    this.myTag = this.fullName;
    return this.fullName;
  }

  @traceable()
  public async my_call_endpoint_method(hello: string): Promise<string> {
    const agent = new https.Agent({ rejectUnauthorized: false });
    let headers = {"x-api-key": "mySecret"};
    headers = {...this.mygetHeaderSpan, ...headers};
    const opts = { timeout: 3000, headers, httpsAgent: agent};
    return (await Axios.get("http:another.traceable.endpoint/" + hello, opts)).data.toString();
  }
}

const Homer = new Parent("Homer", "Simpson");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());

```

* Javascript

```js
var decorators = require("jaeger-tracer-decorator");

class Parent {

  constructor(){
    console.log("My Parent Constructor");
  }

  parentName(first, last) {
    this.firstName(first);
    this.lastName(last);
  }

  firstName(name) {
    this.first = name;
  }

  lastName(name) {
    this.last = name;
  }

  fullName() {
    console.log("My Header --> ", this.header);
    return this.first + " " + this.last;
  }

  sayName() {
    const myFullName = this.fullName();
    this.tag = myFullName;
    console.log(myFullName);
  }
}

Parent = decorators.decorateClass(Parent);
decorators.decorateMethod(Parent, "parentName");
decorators.decorateMethod(Parent, "firstName");
decorators.decorateMethod(Parent, "lastName");
decorators.decorateMethod(Parent, "fullName");
decorators.decorateMethod(Parent, "sayName");
decorators.decoratePropertyTag(Parent, "tag", "full_name");
decorators.decoratePropertyHeader(Parent, "header");

const Homer = new Parent("Homer", "Simpson");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());

```