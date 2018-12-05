import { traceable } from "../../index";
import { Parent } from "./parent";

@traceable()
export class Controller {
  private Homer: Parent;

  constructor() {
    this.Homer = new Parent("Homer", "Simpson");
  }

  @traceable()
  public getName() {
    return this.Homer.sayYourFullName();
  }

  @traceable()
  public getSon() {
    return this.Homer.sayYourSonFullName();
  }
}
