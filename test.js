// var x=require("./jsep");
// var y=require("./js_parse");
// var ret = x("x=={0}", 'xxx');
// var c=y(ret.fx,ret.params);
// console.log(c);
var mg=require("mongoose");
var qr=require("./index");
// var x=require("./index");
// var m=require("mongoose");
var cnn=mg.createConnection("mongodb://root:123456@localhost:27017/hrm");
try {
    var r = qr(cnn, "hrm.mmx").set({
        code: "123485xq",
        name:"12345"
    }).commit();
        var x=r;
} catch (error) {
    throw error;
}

console.log(r);
// x.connections.set("main","mongod://sys:123456@localhost:27017/hrm");
// console.log(x.connections.get("main"));

