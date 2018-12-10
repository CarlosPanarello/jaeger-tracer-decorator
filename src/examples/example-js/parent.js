"use strict";
var decorators = require("../../index");
var Child = require("./child")

class Parent {

  constructor(first, last, sonName) {
    this.child = new Child(last, sonName);
    this.fullName = first + " " + last;
  }

  sayYourSonFullName() {
    this.myOtherTag = this.child.sayMyFullName();
    return this.myOtherTag;
  }

  sayYourFullName() {
    this.myTag = this.fullName;
    return this.fullName;
  }

  myHeaderGenMethod(){
    let headers = {"x-api-key": "mySecret"};
    headers = {...this.mygetHeaderSpan, ...headers};
    const opts = { timeout: 3000, headers};
    return opts;
  }
}

Parent = decorators.decorateClass(Parent);
decorators.decorateMethod(Parent, "sayYourSonFullName");
decorators.decorateMethod(Parent, "sayYourFullName");
decorators.decorateMethod(Parent, "myHeaderGenMethod");
decorators.decoratePropertyTag(Parent, "myOtherTag", "full_name_son");
decorators.decoratePropertyTag(Parent, "myTag");
decorators.decoratePropertyHeader(Parent, "mygetHeaderSpan");

module.exports = Parent;