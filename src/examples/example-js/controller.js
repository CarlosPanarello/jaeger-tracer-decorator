"use strict";
require('dotenv').config()
var Parent = require("./parent.js")
var decorators = require("../../../dist/index.js");

class Controller {

  constructor() {
    this.Homer = new Parent("Homer", "Simpson");
  }

  getName(req) {
    console.log("Span", req.params.jaegerSpan);
    console.log("Header", req.params.jaegerHeader);
    return this.Homer.sayYourFullName();
  }

  getSon(req) {
    console.log("Span", req.params.jaegerSpan);
    console.log("Header", req.params.jaegerHeader);
    return this.Homer.sayYourSonFullName();
  }
}

Controller = decorators.decorateClass(Controller);
decorators.decorateMethod(Controller, "getName");
decorators.decorateMethod(Controller, "getSon");

module.exports = Controller;