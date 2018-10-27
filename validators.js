function getValueByPath(path,data){
    var items=path.split('.');
    var obj=data;
    for(var i=0;i<items.length-1;i++){
        if(obj[items[i]]===null |
            obj[items[i]] === undefined  ){
            return null;
        }
        else {
            obj=obj[items[i]];
        }
    }
    return obj[items[items.length-1]];
}
function checkIsMissData(fields,data){
    var result=[];
    var i=0;
    var r=[];
    for(i=0;i<fields.length;i++){
        var ret=getValueByPath(fields[i],data);
        if(ret==null ||
            ret==undefined){
            result.push(fields[i]);
        }
    }
    if(data.$set){
        r=checkIsMissData(fields,data.$set);
        for(i=0;i<r.length;i++){
            result.push(r[i]);
        }
    }
    if (data.$unset) {
        r = checkIsMissData(fields, data.$unset);
        for (i = 0; i < r.length; i++) {
            result.push(r[i]);
        }
    }
    return result;
}
module.exports={
    getValueByPath: getValueByPath,
    checkIsMissData: checkIsMissData
}