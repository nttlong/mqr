var __models = {};
var __modelHasApplied = {};
var sync = require("./sync");
var IndexTypes = {
    unique: {
        unique: true
    }
}
function IndexInfo() {

}
IndexInfo.prototype.fields = {};
IndexInfo.prototype.options = IndexTypes;

/**
 * 
 * @param {string} name 
 * @param {IndexInfo[]} indexes 
 * @param {string[]} required 
 * @param {*} fields 
 */
var BSONTypes = {
    ObjectId: "objectId",
    Boolean: "bool",
    Date: "date",
    Null: "null",
    RegularExpression: "regex",
    Int32: "int",
    Timestamp: "timestamp",
    Int64: "long",
    Decimal: "decimal",
    MinKey: "minKey",
    MaxKey: "maxKey",
    String: "string",
    Array: "array",
    Object: "object"
};
function convertIndex(info) {
    var ret = {
        fields: {}
    };
    if (info.fields instanceof Array) {
        for (var i = 0; i < info.fields.length; i++) {
            ret.fields[info.fields[i]] = 1
        }
        ret.options = info.options;
        return ret;
    }
    else {
        return info;
    }


}
function convertIndexes(lst) {
    var ret = [];
    for (var i = 0; i < lst.length; i++) {
        ret.push(convertIndex(lst[i]));
    }
    return ret;
}
function convertToMongodb(obj, parentKey) {
    if (obj === undefined || obj === null) {
        return undefined;
    }
    var ret = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = obj[key];
        if (typeof val === "string" ||
            ((val instanceof Array) &&
                (val.length > 0))) {
            if (!_CheckKeys[val]) {
                //return;
                if (parentKey) {
                    throw (new Error(`'${val}' of '${parentKey + "." + key}' is invalid datatype`))
                }
                else {
                    throw (new Error(`'${val}' of '${key}' is invalid datatype`))
                }

            }
            ret[key] = {
                bsonType: val
            };
        }
        else if (val.bsonType) {
            ret[key] = val;
        }
        else if (typeof val.detail === "string") {
            ret[key] = {
                bsonType: val.fieldType,
                items: {
                    bsonType: val.detail
                }
            };
        }
        else {

            ret[key] = convertToMongodb(val, key);
        }
    }
    return ret;
}
var _CheckKeys = {};
for (var i = 0; i < Object.keys(BSONTypes).length; i++) {
    _CheckKeys[BSONTypes[Object.keys(BSONTypes)[i]]] = true;
}
function unwindFields(obj) {
    var keys = Object.keys(obj);
    var ret = {};
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = obj[key];
        if (typeof val === "string") {
            ret[key] = val;
        }
        else if (val.fieldType === BSONTypes.Object) {
            ret[key] = val.fieldType;
            if (typeof val.detail !== "string") {
                var detail = unwindFields(val.detail);
                var keysOfDetails = Object.keys(detail);
                for (var j = 0; j < keysOfDetails.length; j++) {
                    var keyOfDetail = keysOfDetails[j];
                    var valOfDetail = detail[keyOfDetail];
                    ret[key + "." + keyOfDetail] = valOfDetail;
                }
            }


        }
        else if (val.fieldType === BSONTypes.Array) {
            if (typeof val.detail === "string") {
                ret[key] = {
                    bsonType: "array",
                    items: {
                        bsonType: val.detail
                    }
                };
                if (val.required && val.required.length > 0) {
                    ret[key].items.required = val.required;
                }
            }
            else {
                ret[key] = {
                    bsonType: "array",
                    items: {
                        bsonType: "object",

                        properties: convertToMongodb(val.detail)
                    }
                };
                if (val.required && val.required.length > 0) {
                    ret[key].items.required = val.required;
                }
            }

        }
    }
    return ret;

}

function createModel(name, indexes, fields) {

    if (indexes && (!(indexes instanceof Array))) {
        throw ("the second param must be Array");
    }
    indexes = convertIndexes(indexes);
    //var _fields = unwindFields(fields);
    //var bsonFields = convertToMongodb(_fields);
    //delete bsonFields.required;

    __models[name] = {
        name: name,
        indexes: indexes,

        fields: fields
    };

}
function isExistCollection(db, name, cb) {
    function run(cb) {
        if (!db.db) {
            db.client.connect().then(function (cnn) {
                var _db = cnn.db(db.name);
                _db.eval("db.getCollectionInfos({name:'" + name + "'})", function (e, r) {
                    if (e) {
                        cb(e);
                    }
                    else {
                        cb(null, r.length > 0);
                    }
                });

            }).catch(function (ex) {
                cb(ex);
            });
        }
        else {
            db.db.eval("db.getCollectionInfos({name:'" + name + "'})", function (e, r) {
                if (e) {
                    cb(e);
                }
                else {
                    cb(null, r.length > 0);
                }
            });
        }
        // db.collections(name, function (err, names) {
        //     cb(err, names.length > 0);
        // });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }
}
function createCollection(db, name, cb) {
    function run(cb) {
        db.db.eval("db.createCollection('" + name + "')", function (e, r) {
            cb(e, r);
        });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }
}
function getValidatorInfo(db, name, cb) {
    function run(cb) {
        db.db.eval("db.getCollectionInfos({name:'" + name + "'})", function (e, r) {
            if (e) {
                cb(e);
            }
            else {
                if (r.length > 0) {
                    if (r[0] &&
                        r[0].options &&
                        r[0].options.validator &&
                        r[0].options.validator.$jsonSchema)
                        cb(null, r[0].options.validator.$jsonSchema);
                }
                else {
                    cb(e, null);
                }
            }

        });
    };
    return sync.sync(run, []);
}
function createJsonSchemaValidator(db, name, required, fields) {


    var options = {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: fields.required,
                properties: fields.properties
            }
        }
    };
    if (required && required.length > 0) {
        options.validator.$jsonSchema.required = required;
    }
    function run(cb) {
        db.db.eval("db.createCollection('" + name + "'," + JSON.stringify(options) + ")", function (e, r) {
            if (r.ok === 0) {
                db.db.command({
                    "collMod": name,
                    "validator": options.validator,
                    "validationLevel": "moderate"
                }, function (e, r) {
                    cb(e, r);
                });
            }
            else {
                cb(e, r);
            }

        });
    }
    return sync.sync(run, []);

}
function createIndex(db, name, index, cb) {
    function run(cb) {
        db.collection(name).createIndex(index.fields, index.options, function (e, r) {
            cb(e, r);
        });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }

}
function applyAllModel(db, name, cb) {
    try {
        if (!__modelHasApplied[name]) {
            if (!isExistCollection(db, name)) {
                createCollection(db, name);
            }
            if (__models[name].indexes &&
                (__models[name].indexes.length > 0)) {
                for (var i = 0; i < __models[name].indexes.length; i++) {
                    createIndex(db, name, __models[name].indexes[i]);
                }

            }
            if (__models[name].fields) {
                createJsonSchemaValidator(db, name, __models[name].required, __models[name].fields);

            }
            __modelHasApplied[name] = true;
        }
    } catch (error) {
        throw (new Error(`create validator for ${name} is error with ${error.message}`));
    }

}


function applyAllModels(db) {
    var keys = Object.keys(__models);
    for (var i = 0; i < keys.length; i++) {
        applyAllModel(db, keys[i]);
    }
}

function embeded(fieldType, required, detail) {
    return {
        fieldType: fieldType,
        required: required,
        detail: detail
    }

}

module.exports = {
    createModel: createModel,
    models: __models,
    isExistCollection: isExistCollection,
    applyAllModels: applyAllModels,
    createIndexInfo: function (fields, options) {
        return new IndexInfo(fields, options);
    },
    FieldTypes: BSONTypes,
    IndexTypes: IndexTypes,
    embeded: embeded
};
