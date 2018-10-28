var __index = {};
var __info = {};
var validator=require("./validators");
var sync =require("./sync");
var error=require("./error");
function getJsonValidateInfo(db, collectionName) {
    
    function run(cb) {
        db.db.eval("db.getCollectionInfos({name:'" + collectionName + "'})", function (e, r) {
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
function getError(db, collectionName, e, data) {
    var message = null;
    var index =null;
    var errorCode =null;
    var code =null;
    var i = 0;
    var chkFields = [];
   
    function run(index,cb) {
        if (__index[collectionName] && __index[collectionName][index]){
            cb(null, __index[collectionName][index]);
            return;
        }
        if (!__index[collectionName]){
            __index[collectionName]={};
        }
        if (!__index[collectionName][index]) {
            __index[collectionName][index]= [];
        }
        db.collection(collectionName).getIndexes(function (e, r) {
            if(e){
                cb(e);
            }
            else {
                for (i = 0; i < r[index].length; i++) {
                    __index[collectionName][index].push(r[index][i][0]);
                }
                cb(null, __index[collectionName][index]);
            }
            
        });
    }
    if (!e) {
        return null;
    }
    if (e.code == 11000) {
        message= e.message.split(':')[0];
        index = e.message.split(':')[2].split(' ')[1];
        errorCode= e.code;
        code= "DUPL";
        fields = sync.sync(run, [index]);
        return error(e.message, e.code, "DUPL", fields,null,null);

    }
    if (e.code === 121) {
        var info = getJsonValidateInfo(db, collectionName);
        if (!(data instanceof Array)) {
            chkFields = validator.checkIsMissData(info.required, data);
            if (chkFields.length > 0) {
                return error(e.messages,e.code,"MISS",chkFields,null,null);
            }
            else {
                return error(e.message, e.code,"INVD",null,info.properties,null);
            }
        }
        else {
            var errorList = [];
            for (i = 0; i < data.length; i++) {
                chkFields = validator.checkIsMissData(info.required, data);
                if (chkFields.length > 0) {
                    errorList.push({
                        index: i,
                        fields: chkFields,
                        code: "MISS"
                    });
                }
            }
            if (errorList.length > 0) {
                return error(e.message, e.code, "MISS",null,null, errorList);
            }
            else {
                return error(e.message, e.code, "INVD",null, info.properties, errorList);
                
            }
        }


    }
    else {
        return e;
    }
}
module.exports ={
    getJsonValidateInfo: getJsonValidateInfo,
    getError: getError
}