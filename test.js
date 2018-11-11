var x = require("./index");

x.model("cccc", [
    {
        fields: { x: 1 },
        options: {
            unique: true
        }
    }
],
    {
        required:["c"],
        properties:{
            code:{
                bsonType:x.FieldTypes.String
            },
            name:{
                bsonType:x.FieldTypes.Object,
                required:["default"],
                properties:{
                    default:{
                        bsonType: x.FieldTypes.String
                    }
                }
            }
        }
    });

var c = require("mongoose").createConnection("mongodb://localhost:27017/qlns");

x.query(c,"cccc").insert({}).commit();