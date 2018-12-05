"use strict";
var decorators = require("../../../dist/index.js");

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

module.exports = Parent;