import { traceable } from "../../index";
import { Parent } from "./parent";

@traceable()
export class Controller {
  private Homer: Parent;

  constructor() {
    this.Homer = new Parent("Homer", "Simpson");
  }

  @traceable()
  public getName(req: any) {
    console.log("Span", req.params.jaegerSpan);
    console.log("Header", req.params.jaegerHeader);
    return this.Homer.sayYourFullName();
  }

  @traceable()
  public getSon(req: any) {
    console.log("Span", req.params.jaegerSpan);
    console.log("Header", req.params.jaegerHeader);
    return this.Homer.sayYourSonFullName();
  }
}
