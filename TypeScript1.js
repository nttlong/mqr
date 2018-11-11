"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fx = require("./index");
var index_1 = require("./index");
//import * as q from "mongoose";
fx.model("cccc", [
    {
        fields: {
            x: 1
        },
        options: {
            unique: true
        }
    }
], {
    properties: {
        x: {
            bsonType: index_1.BSONTypes.Array,
            items: {
                properties: {}
            }
        }
    }
});
//# sourceMappingURL=TypeScript1.js.map