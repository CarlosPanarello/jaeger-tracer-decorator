"use strict";
require('dotenv').config()
var Parent = require("./parent")
var JaegerTracer = require("../../index").JaegerTracer;

const jaeger = new JaegerTracer();
const Homer = new Parent("Homer", "Simpson", "Bart");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());


setTimeout(() => process.exit(0), 1000);
