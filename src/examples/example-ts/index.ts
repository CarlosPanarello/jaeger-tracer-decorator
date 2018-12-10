import { JaegerTracer } from "../../index";
import { Parent } from "./parent";

console.log(process.env.NODE_ENV);
const jaeger = new JaegerTracer();

const Homer = new Parent("Homer", "Simpson", "Bart");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());

setTimeout(() => process.exit(0), 1000);
