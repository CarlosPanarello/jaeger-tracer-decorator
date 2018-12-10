import { traceable } from "../../index";
import { Parent } from "./parent";

@traceable()
export class Controller {
  private Homer: Parent;

  constructor() {
    this.Homer = new Parent("Homer", "Simpson", "Bart");
  }

  @traceable()
  public getName(req: any) {
    return this.Homer.sayYourFullName();
  }

  @traceable()
  public getSon(req: any) {
    return this.Homer.sayYourSonFullName();
  }

  @traceable()
  public getNameWithouParamReq(name: string) {
    return this.Homer.sayYourFullName();
  }
}
