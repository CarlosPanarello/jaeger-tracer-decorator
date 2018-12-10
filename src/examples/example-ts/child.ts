import { traceable  } from "../../index";

@traceable()
export class Child {

  private myName: string;
  private myLastName: string;

  constructor(fathersLastName: string, myName: string) {
    console.log("Constructor of Child");
    this.myLastName = fathersLastName;
    this.myName = myName;
  }

  @traceable()
  public sayMyFullName() {
    return "My name is " + this.myName + " " +  this.myLastName;
  }

}
