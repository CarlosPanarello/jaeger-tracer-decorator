"use strict";
require('dotenv').config()
var Parent = require("./parent.js")
var JaegerTracer = require("../../../dist/index.js").JaegerTracer;

const jaeger = new JaegerTracer();
const Homer = new Parent("Homer", "Simpson");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());


setTimeout(() => process.exit(0), 1000);
