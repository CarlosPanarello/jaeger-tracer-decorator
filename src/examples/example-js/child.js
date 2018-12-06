"use strict";
var decorators = require("../../../dist/index.js");

class Child {

  constructor(fathersLastName, myName) {
    console.log("Constructor of Child");
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