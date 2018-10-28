var mongoose=require("mongoose");
var sync=require("./sync");
var modelsUtils=require("./modelsUtils")
module.exports = {
    query: require("./qr"),
    model: modelsUtils.createModel,
    FieldTypes: modelsUtils.FieldTypes,
    createIndexInfo: modelsUtils.createIndexInfo
}