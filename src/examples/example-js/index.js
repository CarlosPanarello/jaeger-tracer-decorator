"use strict";
require('dotenv').config()
var Parent = require("./parent.js")
var JaegerTracer = require("../../../dist/index.js").JaegerTracer;

const jaeger = new JaegerTracer();
const father = new Parent();

father.parentName('Homer', 'Simpson');
father.sayName();

setTimeout(() => process.exit(0), 1000);
