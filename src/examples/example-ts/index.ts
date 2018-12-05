import { Parent } from "./parent";

console.log(process.env.NODE_ENV);
const Homer = new Parent("Homer", "Simpson");

console.log(Homer.sayYourFullName());
console.log(Homer.sayYourSonFullName());

setTimeout(() => process.exit(0), 1000);
