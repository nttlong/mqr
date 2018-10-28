function dataError(message, errorCode, code, fields,schema,errorList) {
    var ret = {
        message: message,
        errorCode: errorCode,
        code: code,
        fields: fields,
        schema: schema,
        errorList: errorList

    };
    
    return ret;
}
module.exports = dataError;