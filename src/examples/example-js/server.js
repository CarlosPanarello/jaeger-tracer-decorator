require('dotenv').config()

var express = require('express');
var app = express();
var port = Number(process.env.NODE_PORT) + 1;
var Controller = require("./controller.js");
var expressMiddlewareTracer = require("../../../dist/index.js").expressMiddlewareTracer;
var JaegerTracer = require("../../../dist/index.js").JaegerTracer;

const jaegerTracer = new JaegerTracer();

const endpointForTracing = (path) => {
  return !path.startsWith("/ping");
};
const transformPathInSpanName = (path) => {
  switch (true) {
    case path.startsWith("/fullname/son"):
      return "Get_Sons_FullName_API";
    case path.startsWith("/fullname/father"):
      return "Get_Fathers_FullName_API";
    default:
      return path;
  }
};
const requestTags = ["id", "headers"];
const middle = expressMiddlewareTracer({
  jaegerTracer,
  endpointForTracing,
  transformPathInSpanName,
  requestTags,
});


app.get('/ping',middle, function (req, res) {
  res.send('Pong');
});

app.get("/fullname/son", middle, function (req, resp) {
  console.log("request", req);
  resp.send(new Controller().getSon(req));
});

app.get("/fullname/father", middle,  function (req, resp) {
  resp.send(new Controller().getName(req));
});
// app.use('/', router);
app.listen(port, function () {
  console.log('Example app listening on port !' + port);
});