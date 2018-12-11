"use strict";
var decorators = require("../../index");

class Child {

  constructor(fathersLastName, myName) {
    this.myLastName = fathersLastName;
    this.myName = myName;
  }

  sayMyFullName() {
    return "My name is " + this.myName + " " +  this.myLastName;
  }
}

Child = decorators.decorateClass(Child);
decorators.decorateMethod(Child, "sayMyFullName");

module.exports = Child;