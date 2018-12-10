"use strict";
require('dotenv').config()
var Parent = require("./parent")
var decorators = require("../../index");

class Controller {

  constructor() {
    this.Homer = new Parent("Homer", "Simpson");
  }

  getName(req) {
    return this.Homer.sayYourFullName();
  }

  getSon(req) {
    return this.Homer.sayYourSonFullName();
  }
}

Controller = decorators.decorateClass(Controller);
decorators.decorateMethod(Controller, "getName");
decorators.decorateMethod(Controller, "getSon");

module.exports = Controller;