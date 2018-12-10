import jaegerClient = require("jaeger-client");
import "jest";
import * as Prometheus from "prom-client";
import "reflect-metadata";
import * as restify from "restify";
import * as request from "supertest";
import * as ERROR_MSG from "../constants/error_msgs";
import * as METADATA_KEY from "../constants/metadata_key";
import { traceable } from "../decorators/decorators_ts";
import { Controller } from "../examples/example-ts/controller";
import { Parent } from "../examples/example-ts/parent";
import { JaegerTracer, middlewareTracer, RequestTags } from "../index";
import { IJaegerOptions, IOptionsMiddleware } from "../interfaces/interfaces";

const TAG_HEADER = "uber-trace-id";

beforeAll(() => {
  require("dotenv").config();
  process.env.JAEGER_DISABLED = "true";
});

describe("Decorators in javascript", () => {
  test("Using Traceable setTagSpan getHeaderSpan in Class and Methods", () => {
    const myJaeger = new JaegerTracer();
    const MyParent = require("../examples/example-js/parent");
    const father = new MyParent("MyFirstName", "MyLastName", "SonName");
    expect("MyFirstName MyLastName").toBe(father.sayYourFullName() );
    expect("My name is SonName MyLastName").toBe(father.sayYourSonFullName());
    expect(father.myHeaderGenMethod().headers[TAG_HEADER]).toBeDefined();
    myJaeger.tracer.close(Function());
  });
});

describe("Using Restify Server with middleware", () => {
  const address = "localhost:3000";
  let server: any;
  beforeAll(() => {
    // tslint:disable-next-line:max-classes-per-file
    class MyServer {
      private myJaeger: JaegerTracer;
      private app: restify.Server|undefined;
      constructor() {
        const optionsJaeger: IJaegerOptions = {
          serviceName: "Server_Test",
          serviceVersion: "1.0.0",
          disable: false,
          sampler: {
            type: "const",
            param: 1,
          },
          reporter: {
            logSpans: true,
            agentHost: "localhost",
            agentPort: 6832,
          },
        };
        this.myJaeger = new JaegerTracer(undefined, undefined, optionsJaeger);
      }

      public async startServer(): Promise<restify.Server> {
        this.app = restify.createServer({
          name: "Server for Test",
        });
        const requestTags: RequestTags[] = ["id", "headers"];

        const opt: IOptionsMiddleware = {
          tracer: this.myJaeger.tracer,
          requestTags,
        };

        this.app.use(middlewareTracer(opt));
        this.app.use(restify.plugins.queryParser());
        this.app.use(restify.plugins.bodyParser());
        this.app.get("/fullname/son", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getSon(req));
          next();
        });
        this.app.get("/fullname/father", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getName(req));
          next();
        });
        this.app.get("/header", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send({header: req.params.jaegerHeader});
        });
        this.app.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);
        return this.app;
      }
      public shutdown() {
        if (this.app) {
          this.myJaeger.tracer.close(Function);
          this.app.close();
        }
      }
    }
    server = new MyServer();
    server.startServer();
  });

  afterAll(() => {
    server.shutdown();
  });

  test("Start a span in middleware", () => {
    return request(address)
    .get("/header")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body.header).toBeDefined();
    }).catch(fail);
  });
  test("Continue a span in middleware", () => {
    return request(address)
    .get("/header")
    .set(TAG_HEADER, "b38459bed0e57aa9:b38459bed0e57aa9:0:1")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body.header).toBeDefined();
    }).catch(fail);
  });
  test("Continue a span in middleware and continue inside a decorator controller", () => {
    return request(address)
    .get("/fullname/son")
    .set(TAG_HEADER, "b38459bed0e57aa9:b38459bed0e57aa9:0:1")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual("My name is Bart Simpson");
    }).catch(fail);
  });
});

describe("Using Restify Server with middleware with functions and metrics", () => {
  const address = "localhost:3000";
  let server: any;
  const prometheus = Prometheus;
  beforeAll(() => {
    // tslint:disable-next-line:max-classes-per-file
    class MyServer {
      private myJaeger: JaegerTracer;
      private app: restify.Server|undefined;
      constructor() {
        const optionsJaeger: IJaegerOptions = {
          serviceName: "Server_Test_2",
          serviceVersion: "1.0.0",
          disable: false,
          sampler: {
            type: "const",
            param: 1,
          },
          reporter: {
            logSpans: true,
            agentHost: "localhost",
            agentPort: 6832,
          },
        };
        this.myJaeger = new JaegerTracer(prometheus, undefined, optionsJaeger);
      }

      public async startServer(): Promise<restify.Server> {
        this.app = restify.createServer({
          name: "Server for Test",
        });
        const endpointForTracing = (path: string): boolean => path.includes("/fullname/son");
        const transformPathInSpanName = (path: string): string =>  "my_" + path;

        const opt: IOptionsMiddleware = {
          tracer: this.myJaeger.tracer,
          endpointForTracing,
          transformPathInSpanName,
        };

        this.app.use(middlewareTracer(opt));
        this.app.use(restify.plugins.queryParser());
        this.app.use(restify.plugins.bodyParser());
        this.app.get("/fullname/son", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getSon(req));
          next();
        });
        this.app.get("/fullname/father", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getName(req));
          next();
        });
        this.app.get("/header", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send({header: req.params.jaegerHeader});
        });
        this.app.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);
        return this.app;
      }
      public shutdown() {
        if (this.app) {
          this.myJaeger.tracer.close(Function);
          this.app.close();
        }
      }
    }
    server = new MyServer();
    server.startServer();
  });

  afterAll(() => {
    server.shutdown();
  });

  test("Start a span in middleware", () => {
    return request(address)
    .get("/fullname/son")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual("My name is Bart Simpson");
    }).catch(fail);
  });
  test("Not start span in middleware with filter endpoint", () => {
    return request(address)
    .get("/header")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body.header).toBeUndefined();
    }).catch(fail);
  });
});

describe("Using Restify Server without middleware", () => {
  const address = "localhost:3000";
  let server: any;
  beforeAll(() => {
    // tslint:disable-next-line:max-classes-per-file
    class MyServer {
      private myJaeger: JaegerTracer;
      private app: restify.Server|undefined;
      constructor() {
        const optionsJaeger: IJaegerOptions = {
          serviceName: "Server_Test_Without_middleware",
          serviceVersion: "   ",
          disable: false,
          sampler: {
            type: "const",
            param: 1,
          },
          reporter: {
            logSpans: true,
            agentHost: "localhost",
            agentPort: 6832,
          },
        };
        const defaultConsoleLogger = {
          info: (info: any) => console.log(info),
          error: (error: any) => console.log(error),
        };
        this.myJaeger = new JaegerTracer(undefined, defaultConsoleLogger, optionsJaeger);
      }

      public async startServer(): Promise<restify.Server> {
        this.app = restify.createServer({
          name: "Server for Test",
        });

        this.app.use(restify.plugins.queryParser());
        this.app.use(restify.plugins.bodyParser());
        this.app.get("/fullname/son", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getSon(req));
          next();
        });
        this.app.get("/fullname/father", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getName(req));
          next();
        });
        this.app.get("/fullname/other", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
          res.send(new Controller().getNameWithouParamReq("other"));
          next();
        });

        this.app.listen(process.env.NODE_PORT ? process.env.NODE_PORT : 3000);
        return this.app;
      }
      public shutdown() {
        if (this.app) {
          this.myJaeger.tracer.close(Function);
          this.app.close();
        }
      }
    }
    server = new MyServer();
    server.startServer();
  });

  afterAll(() => {
    server.shutdown();
  });

  test("Continue a span inside a decorator controller", () => {
    return request(address)
    .get("/fullname/father")
    .set(TAG_HEADER, "b38459bed0e57aa9:b38459bed0e57aa9:0:1")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual("Homer Simpson");
    }).catch(fail);
  });
  test("Continue a span inside a decorator controller with invalid header", () => {
    return request(address)
    .get("/fullname/father")
    .set(TAG_HEADER, "wrongHeader")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual("Homer Simpson");
    }).catch(fail);
  });
  test("Start a new span without param that contains a span", () => {
    return request(address)
    .get("/fullname/other")
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual("Homer Simpson");
    }).catch(fail);
  });
});

describe("Decorators in Class and Methods of Typescript", () => {
  let jaeger: JaegerTracer;
  let mockStartSpan: any;
  beforeEach(() => {
    jaeger = new JaegerTracer();
    const original = jaeger.tracer.startSpan;
    mockStartSpan = jest.spyOn(jaegerClient.Tracer.prototype, "startSpan").mockImplementation(original);
  });

  afterEach(() => {
    jaeger.tracer.close(Function);
  });

  test("Using Traceable setTagSpan getHeaderSpan in Class and Methods", () => {
    const parent = new Parent("MyFirstName", "MyLastName", "SonName");
    const name = parent.sayYourFullName();
    const filho = parent.sayYourSonFullName();
    const opt = parent.myHeaderGenMethod();
    return parent.sayYourFullNameAsPromise().then(() => {
      expect(mockStartSpan.mock.calls.length).toEqual(5);
      expect("MyFirstName MyLastName").toBe(name);
      expect("My name is SonName MyLastName").toBe(filho);
      expect(opt.headers[TAG_HEADER]).toBeDefined();
    }).catch((e: any) => fail(e));
  });

  test("Traceable in param", () => {
    try {
      // tslint:disable-next-line:max-classes-per-file
      @traceable()
      class MyClass {

        private info: string;

        constructor() {
          this.info = "info";
        }
        public my_func(@traceable() test: string) {
          console.log(test);
        }
      }
      const myClass = new MyClass();
      myClass.my_func("test");
      fail();
    } catch (e) {
      expect(e.message).toEqual(ERROR_MSG.INVALID_LOCAL_TRACEABLE_DECORATOR);
    }
  });

  test("Traceable in property", () => {
    try {
      // tslint:disable-next-line:max-classes-per-file
      @traceable()
      class MyClassProperty {
        @traceable()
        private info: string;

        constructor() {
          this.info = "info";
        }
        public my_func( test: string) {
          console.log(test + this.info);
        }
      }
      const myClass = new MyClassProperty();
      myClass.my_func("test");
      fail();
    } catch (e) {
      expect(e.message).toEqual(ERROR_MSG.INVALID_LOCAL_TRACEABLE_DECORATOR);
    }
  });

  test("Class doesn't have Traceable decorator", () => {
    try {
      // tslint:disable-next-line:max-classes-per-file
      class MyClassWithout {
        private info: string;

        constructor() {
          this.info = "info";
        }
        @traceable()
        public my_func( test: string) {
          console.log(test + this.info);
        }
      }
      const myClass = new MyClassWithout();
      myClass.my_func("test");
      fail();
    } catch (e) {
      expect(e.message).toEqual(ERROR_MSG.CLASS_DONT_HAVE_DECORATOR);
    }
  });
  test("Without tracer", () => {
    try {
      // tslint:disable-next-line:max-classes-per-file
      @traceable()
      class MyClassWithout {
        private info: string;

        constructor() {
          this.info = "info";
        }
        @traceable()
        public my_func( test: string) {
          console.log(test + this.info);
        }
      }
      const myClass = new MyClassWithout();
      Reflect.defineMetadata(METADATA_KEY.GLOBAL_TRACER, undefined, JaegerTracer);

      myClass.my_func("test");
      fail();
    } catch (e) {
      expect(e.message).toEqual(ERROR_MSG.TRACER_NOT_INITIALIZE);
    }
  });
});
