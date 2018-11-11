import * as fx from "./index"
import { BSONTypes } from "./index";

//import * as q from "mongoose";


fx.model("cccc", [
    {
        fields: {
            x:1
        },
        options: {
            unique: true
        }
    }

],
    {
        properties: {
            x: {
                bsonType: BSONTypes.Array,
                items: {
                    properties: {

                    }
                }
            }
        }

    }

)

