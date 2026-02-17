const EventEmiter=require("events");
class MyEmitter extends EventEmiter{}
const myEmitter = new MyEmitter();

myEmitter.on("waterFull",()=>{
    console.log(" Please Turn off the motor"
    );
    setTimeout(()=>{
        console.log("Please turn off the motor ! its a gentel reminder");
    }, 3000);
});
console.log("The Script is runnning")

myEmitter.emit("waterFull");