import https = require("https");
import { getHeaderSpan, setTagSpan, traceable  } from "../../decorators/decorators_ts";
import { Child } from "./child";

@traceable()
export class Parent {

  @getHeaderSpan()
  private mygetHeaderSpan: any;

  @setTagSpan()
  private myTag: any;

  @setTagSpan("full_name_son")
  private myOtherTag: any;

  private child: Child;

  private fullName: string;

  constructor(first: string, last: string) {
    this.child = new Child(last, "Bart");
    this.fullName = first + " " + last;
  }

  @traceable()
  public sayYourSonFullName(): string {
    this.myOtherTag = this.child.sayMyFullName();
    return this.myOtherTag;
  }

  @traceable()
  public sayYourFullName(): string {
    this.myTag = this.fullName;
    return this.fullName;
  }

  @traceable()
  public async my_header_generator_method(): Promise<any> {
    const agent = new https.Agent({ rejectUnauthorized: false });
    let headers = {"x-api-key": "mySecret"};
    headers = {...this.mygetHeaderSpan, ...headers};
    const opts = { timeout: 3000, headers, httpsAgent: agent};
    return opts;
  }
}
