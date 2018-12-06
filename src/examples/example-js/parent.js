"use strict";
var decorators = require("../../../dist/index.js");
var Child = require("./child.js")

class Parent {

  constructor(first, last) {
    this.child = new Child(last, "Bart");
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

  my_header_generator_method(){
    const agent = new https.Agent({ rejectUnauthorized: false });
    let headers = {"x-api-key": "mySecret"};
    headers = {...this.mygetHeaderSpan, ...headers};
    const opts = { timeout: 3000, headers, httpsAgent: agent};
    return opts;
  }
}

Parent = decorators.decorateClass(Parent);
decorators.decorateMethod(Parent, "sayYourSonFullName");
decorators.decorateMethod(Parent, "sayYourFullName");
decorators.decorateMethod(Parent, "my_header_generator_method");
decorators.decoratePropertyTag(Parent, "myOtherTag", "full_name_son");
decorators.decoratePropertyTag(Parent, "myTag");
decorators.decoratePropertyHeader(Parent, "mygetHeaderSpan");

module.exports = Parent;