var __models={};
var __modelHasApplied={};
var sync=require("./sync");
function IndexInfo(fields,options){
    this.fields=fields;
    this.options=options;
}
/**
 * 
 * @param {string} name 
 * @param {IndexInfo[]} indexes 
 * @param {string[]} required 
 * @param {*} fields 
 */
var BSONTypes={
    ObjectId:"objectId",
    Boolean: "bool",
    Date: "date",
    Null: "null",
    RegularExpression: "regex",
    Int32: "int",
    Timestamp: "timestamp",
    Int64: "long",
    Decimal: "decimal",
    MinKey: "minKey",
    MaxKey:"maxKey",
    String:"string",
    Array:"array"
};
var _CheckKeys={};
for(var i=0;i<Object.keys(BSONTypes).length;i++){
    _CheckKeys[BSONTypes[Object.keys(BSONTypes)[i]]]=true;
}
function createModel(name,indexes,required,fields){
    function convert(obj) {
        if(obj==undefined || obj==null){
            return undefined;
        }
        var ret = {};
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = obj[key];
            if(typeof val==="string"){
                if (!_CheckKeys[val]){
                    throw(new Error("'"+val+"' is invalid data type, please user FieldTypes"))
                }
                ret[key] = {
                    bsonType: val
                };
            }
            else {
                ret[key]=convert(val);
            }
        }
        return ret;
    }
    if(indexes &&(!(indexes instanceof Array))){
        throw("the second param must be Array");
    }

    if (indexes && indexes.length>0){
        for(var i=0;i<indexes.length;i++){
            if(!(indexes[i] instanceof IndexInfo)){
                throw (new Error("the element in second param must be 'IndexInfo'"));
            }
        }
    }
   
    __models[name]={
        name:name,
        indexes:indexes,
        required:required,
        fields:convert(fields)
    };
}
function isExistCollection(db,name,cb){
    function run(cb) {
        if(!db.db){
            db.client.connect().then(function(cnn){
                var _db=cnn.db(db.name);
                _db.eval("db.getCollectionInfos({name:'"+name+"'})",function(e,r){
                    if(e){
                        cb(e);
                    }
                    else {
                        cb(null,r.length>0);
                    }
                });

            }).catch(function(ex){
                cb(ex);
            });
        }
        else{
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
    if(cb){
        run(cb);
    }
    else {
        return sync.sync(run,[]);
    }
}
function createCollection(db,name,cb){
    function run(cb){
        db.db.eval("db.createCollection('"+name+"')",function(e,r){
            cb(e,r);
        });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }
}
function getValidatorInfo(db,name,cb){
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
function createJsonSchemaValidator(db,name,required,fields){
    
    
    var options = {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: required,
                properties: fields
            }
        }
    };
     function run(cb){
         db.db.eval("db.createCollection('"+name+"',"+JSON.stringify(options)+")",function(e,r){
             if(r.ok==0){
                 db.db.command({
                     "collMod": name,
                     "validator": options.validator,
                     "validationLevel": "moderate"
                 },function(e,r){
                     cb(e, r);
                 });
             }
             else {
                 cb(e, r);
             }
             
         });
     }   
     return sync.sync(run,[]);
    
}
function createIndex(db,name,index,cb){
    if (!(index instanceof IndexInfo)){
        throw (new Error("index must be 'IndexInfo'"));
    }
    
    function run(cb){
        db.collection(name).createIndex(index.fields,index.options, function (e, r) {
              cb(e,r);  
        });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }

}
function applyAllModel(db,name,cb){
    if (!__modelHasApplied[name]) {
        if(!isExistCollection(db,name)){
            createCollection(db,name);
        }
        if (__models[name].indexes &&
            (__models[name].indexes.length>0)){
                for (var i = 0; i < __models[name].indexes.length;i++){
                    if (!(__models[name].indexes[i] instanceof IndexInfo)) {
                        throw (new Error("index "+i+" be 'IndexInfo'"));
                    }
                    createIndex(db, name, __models[name].indexes[i]);
                }
            
        }
        if (__models[name].fields) {
            createJsonSchemaValidator(db, name, __models[name].required, __models[name].fields);

        }
        __modelHasApplied[name]=true;
    }
}
function applyAllModels(db){
    var keys=Object.keys(__models);
    for(var i=0;i<keys.length;i++){
        applyAllModel(db,keys[i]);
    }
}
module.exports={
    createModel: createModel,
    models:__models,
    isExistCollection: isExistCollection,
    applyAllModels:applyAllModels,
    createIndexInfo: function(fields,options){
        return new IndexInfo(fields,options);
    },
    FieldTypes: BSONTypes
};