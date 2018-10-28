// var x=require("./jsep");
// var y=require("./js_parse");
// var ret = x("x=={0}", 'xxx');
// var c=y(ret.fx,ret.params);
// console.log(c);
var mg=require("mongoose");
var qr=require("./index").query;
var model =require("./index").model;
var FieldTypes=require("./index").FieldTypes;
var createIndexInfo = require("./index").createIndexInfo;
// var x=require("./index");
// var m=require("mongoose");
var cnn=mg.createConnection("mongodb://root:123456@localhost:27017/hrm");
// cnn.createCollection("fxccc",{},function(e,r){
//     console.log(e,r);
// });

model("hrm.Emps",[
    createIndexInfo({code:1},{unique:true})
],[
    "code",
    "first_name",
    "last_name"
],{
        code: FieldTypes.String,
        first_name:FieldTypes.String,
        last_name:FieldTypes.String,
        birth_date:FieldTypes.Date,
        gender:FieldTypes.Boolean,
        "location.district":FieldTypes.ObjectId,
        works:FieldTypes.Array,
        "works.year":FieldTypes.Int32

});
try {
    var r = qr(cnn, "hrm.mmx").set({
        code: "123485xq",
        name:"12345"
    }).commit();
        var x=r;
} catch (error) {
    throw error;
}

// x.connections.set("main","mongod://sys:123456@localhost:27017/hrm");
// console.log(x.connections.get("main"));

