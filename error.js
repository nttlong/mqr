var util = require('util');

function MyError(message, errorCode, code, fields, schema, errorList) {
    this.message = message;
    var ret=this;
    ret.message = message;
    ret.code = code;
    ret.errorCode = errorCode;
    ret.fields = fields;
    ret.schema=schema;
    ret.errorList = errorList;
    Error.captureStackTrace(this, MyError);
}



MyError.prototype.setCode=function(code){
    this.code=code;
}
util.inherits(MyError, Error);
function dataError(message, errorCode, code, fields,schema,errorList) {
    var ret = new MyError(message);
    ret.setCode(code);
    // ret.name = this.constructor.name;
    // ret.message = message;
    // ret.code = code;
    // ret.errorCode = errorCode;
    // ret.fields = fields;
    // ret.schema=schema;
    // ret.errorList = errorList;
    return ret;

    // Error.captureStackTrace(this, this.constructor);
    // this.name = this.constructor.name;
    // this.message = message;
    // this.code = code;
    // this.errorCode = errorCode;
    // this.fields = fields;
    // this.schema=schema;
    // this.errorList = errorList;


}
module.exports = dataError