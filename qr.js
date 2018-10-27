var entity=require("./entity");
var js_parse=require("./js_parse");
var validator=require("./validators");
var jsep=require("./jsep");
var sync=require("./sync");
var mg=require("mongoose");

function qr() {
    if(arguments.length==1){
        this.name = arguments[0];
    }
    else if(arguments.length==2){
        this.db=arguments[0];
        this.name=arguments[1];
    }
    this.pipeline = [];
}
qr.prototype.parse = function (obj, params, forMatch, isSecond) {
    if (obj == undefined) {
        return undefined;
    }
    if (!forMatch) {
        forMatch = false;
    }
    if (typeof obj === "string") {

        if (forMatch) {
            return js_parse(jsep(obj, params), params, forMatch, false, "$");
        }
        else {
            return js_parse(jsep(obj, params), params, forMatch, false, "$");
        }

    }
    var txt = JSON.stringify(obj);

    if (txt[0] === "{" && txt[txt.length - 1] === "}") {
        var ret = {};
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = obj[key];

            var r = this.parse(val, params, forMatch);
            if (typeof r === "string") {
                ret[key] = this.parse(val, params, forMatch, true, "$")
            }
            else {
                ret[key] = this.parse(val, params, forMatch, true, "$")
            }

        }
        return ret;
    }
    return obj;
}
qr.prototype.stages = function () {
    for (var i = 0; i < arguments.length; i++) {
        this.pipeline.push(arguments[i]);
    }
    return this;
};
qr.prototype.project = function () {
    var selectors = arguments[0];

    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i]);
    }

    var data = this.parse(selectors, params);

    this.pipeline.push({
        $project: data
    })
    //js_parse(jsep(expr,params),params);
    return this;
};
qr.prototype.addFields = function () {
    var selectors = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    var data = this.parse(selectors, params);
    this.pipeline.push({
        $addFields: data
    })
    //js_parse(jsep(expr,params),params);
    return this;
};
qr.prototype.items = function (db,options) {
    var cb = null;
    if (arguments.length == 1) {
        if (typeof arguments[0] === "function") {
            cb = arguments[0];
        }
        else {
            this.db = arguments[0];
        }
    }
    else if (arguments.length == 2) {
        if (typeof arguments[0] === "function") {
            cb = arguments[0];
            this.db = arguments[1];
        }
        else {
            this.db = arguments[0];
            cb = arguments[1];
        }
    }
    var me = this;
  
    function run(cb) {
        me.db.collection(me.name).aggregate(me.pipeline, function (e, r) {
            if (e) {
                cb(e);
            }
            else {
                r.toArray(function (e, lst) {
                    if (e) {
                        cb(e);
                    }
                    else {
                        cb(null, lst);
                    }
                });
            }

        });
    }
    if (cb) {
        run(cb);
    }
    else {
        return sync.sync(run, []);
    }
};
qr.prototype.item = function () {
    var cb=null;
    if(arguments.length==1){
        if (typeof arguments[0] === "function") {
            cb = arguments[0];
        }
        else {
            this.db=arguments[0];
        }
    }
    else if(arguments.length==2) {
        if (typeof arguments[0] === "function") {
            cb = arguments[0];
            this.db = arguments[1];
        }
        else {
            this.db = arguments[0];
            cb = arguments[1];
        }
    }
    var me=this;
    me.limit(1);
    function run (cb){
        me.db.collection(me.name).aggregate(me.pipeline,function(e,r){
            if(e){
                cb(e);
            }
            else {
                r.toArray(function(e,lst){
                    if(e){
                        cb(e);
                    }
                    else {
                        if(lst.length==0){
                            cb(null, null);
                        }
                        else {
                            cb(null, lst[0]);
                        }
                    }
                });
            }
            
        });
    }
    if(cb){
        run(cb);
    }
    else {
        return sync.sync(run,[]);
    }
};
qr.prototype.match = function () {
    var _expr = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }

    this.pipeline.push({
        $match: js_parse(jsep(_expr, params), params)
    });
    return this;

};
qr.prototype.limit = function (num) {
    this.pipeline.push({
        $limit: num
    });
    return this;
};
qr.prototype.skip = function (num) {
    this.pipeline.push({
        $skip: num
    });
    return this;
};
qr.prototype.count = function (field) {
    if (!field) {
        field = "ret"
    }
    this.pipeline.push({
        $count: field
    });
    return this;
};
qr.prototype.sort = function () {

    this.pipeline.push({
        $sort: arguments[0]
    });
    return this;
};
qr.prototype.orderBy = function () {
    var sort = {};
    var params = arguments[0].split(",")
    for (var i = 0; i < params.length; i++) {
        if (params[i].indexOf(" ") > -1) {
            field = params[i].split(" ")[0];
            sortType = params[i].split(" ")[1];
            if (sortType.indexOf("asc") > -1) {
                sort[field] = 1;
            }
            else if (sortType.indexOf("desc") > -1) {
                sort[field] = -1;
            }
        }
        else {
            sort[params[i]] = 1;
        }
    }
    this.pipeline.push({
        $sort: sort
    });
    return this;
};
qr.prototype.sortByCount = function () {
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    this.pipeline.push({
        $sortByCount: this.parse(arguments[0], params, false, false)
    });
    return this;
};
qr.prototype.unwind = function () {

    if (arguments.length == 1) {
        this.pipeline.push({
            $unwind: "$" + arguments[0]
        });
        return this;
    }
    else if (arguments.length == 2) {
        if (typeof arguments[1] === "string") {
            this.pipeline.push({
                $unwind: {
                    path: "$" + arguments[0],
                    includeArrayIndex: arguments[1]
                }
            });
            return this;
        }

        if (typeof arguments[1] === "boolean") {
            this.pipeline.push({
                $unwind: {
                    path: "$" + arguments[0],
                    preserveNullAndEmptyArrays: arguments[1]
                }
            });
            return this;
        }
    }
    else if (arguments.length == 3) {
        if (typeof arguments[1] === "string") {
            this.pipeline.push({
                $unwind: {
                    path: "$" + arguments[0],
                    includeArrayIndex: arguments[1],
                    preserveNullAndEmptyArrays: arguments[2]
                }
            });
            return this;
        }
        if (typeof arguments[1] === "boolean") {
            this.pipeline.push({
                $unwind: {
                    path: "$" + arguments[0],
                    preserveNullAndEmptyArrays: arguments[1],
                    includeArrayIndex: arguments[2],
                }
            });
            return this;
        }
    }
};
qr.prototype.replaceRoot = function () {
    var _obj = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (typeof _obj == "string") {
        this.pipeline.push({
            $replaceRoot: { newRoot: this.parse(_obj, params) }
        });
        return this;
    }
    else {

        var data = this.parse(_obj, params);
        this.pipeline.push({
            $replaceRoot: { newRoot: data }
        });
        return this;
    }
};
qr.prototype.bucket = function () {
    var data = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (!data.groupBy) {
        throw (new Error("'groupBy' was not found"))
    }
    if (data.boundaries === undefined) {
        throw (new Error("'boundaries' was not found"))
    }
    if (!data.default) {
        throw (new Error("'default' was not found"))
    }
    if (!data.output) {
        throw (new Error("'output' was not found"))
    }
    // if(!(data.boundaries.push)){
    //     throw(new Error("'boundaries' must be an array"))
    // }
    if (typeof data.groupBy !== "string") {
        throw (new Error("'groupBy' must be a string"))
    }
    var groupBy = js_parse(jsep(data.groupBy, params), params, false, false, "$");
    var output = this.parse(data.output, params);
    var _default = this.parse(data.default, params, false, false, "$");
    this.pipeline.push({
        $bucket: {
            groupBy: groupBy,
            boundaries: data.boundaries,
            default: _default,
            output: output

        }
    })
    return this;
};
qr.prototype.bucketAuto = function () {
    var data = arguments[0];
    var params = [];
    if (!data.groupBy) {
        throw (new Error('bucketAuto need a "groupBy" fields'))
    }
    if (data.buckets === undefined) {
        throw (new Error('bucketAuto need a "buckets" fields with numeric data type'))
    }
    var groupBy = js_parse(jsep(data.groupBy, params), params, false, false, "$");
    if (!data.output) {
        this.pipeline.push({
            $bucketAuto: {
                groupBy: groupBy,
                buckets: data.buckets
            }
        });
    }
    else {
        this.pipeline.push({
            $bucketAuto: {
                groupBy: groupBy,
                buckets: data.buckets,
                output: this.parse(data.output, params, false, false, "$")
            }
        });
    }
    return this;
};
qr.prototype.facet = function () {
    var data = arguments[0];
    var keys = Object.keys(data);
    var _facet = {}
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = data[key];
        if (!val.pipeline) {
            throw (new Error("'" + key + "' is not 'query'"))
        }
        _facet[key] = val.pipeline;

    }
    this.pipeline.push({
        $facet: _facet
    });
    return this;
};
qr.prototype.lookup = function () {
    var param1 = arguments[0];
    if (param1._shortName) {
        var _from = param1._shortName;
        if (arguments.length === 4) {
            localField = arguments[1];
            foreignField = arguments[2];
            as = arguments[3];
            this.pipeline.push({
                $lookup: {
                    from: _from,
                    localField: localField,
                    foreignField: foreignField,
                    as: as
                }
            });
            return this;
        }
    }
    else if (typeof param1 === "string") {
        var _from = param1;
        localField = arguments[1];
        foreignField = arguments[2];
        as = arguments[3];
        this.pipeline.push({
            $lookup: {
                from: _from,
                localField: localField,
                foreignField: foreignField,
                as: as
            }
        });
        return this;
    }
    else if (param1.from &&
        param1.localField &&
        param1.foreignField &&
        param1.as) {
        if (param1.from._shortName) {
            param1.from = param1.from._shortName;
            this.pipeline.push({
                $lookup: param1
            });
            return this;
        }
        else {
            param1.from = param1.from._shortName;
            this.pipeline.push({
                $lookup: param1
            });
            return this;
        }
    }
    else if (param1.from &&

        param1.pipeline &&
        param1.as) {
        var params = [];
        for (var i = 1; i < arguments.length; i++) {
            params.push(arguments[i])
        }
        var x = {}
        x.from = param1.from;
        if (param1.from._shortName) {
            x.from = param1.from._shortName;

        }
        if (param1.let) {
            x.let = this.parse(param1.let, params);
        }
        x.pipeline = param1.pipeline.pipeline;
        x.as = param1.as;
        this.pipeline.push({
            $lookup: x
        });
        return this;
    }

};


qr.prototype.group = function () {
    var selectors = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    var data = this.parse(selectors, params);

    this.pipeline.push({
        $group: data
    });
    return this;
};
qr.prototype.out = function (name) {
    this.pipeline.push({
        $out: name
    });
    var op = {
        allowDiskUse: true
    }

    if (this.coll) {

        return this.coll.aggregate(this.pipeline, op);
    }
    else {

        return db.getCollection(this.name).aggregate(this.pipeline, op);
    }

};
qr.prototype.redact = function () {
    var selectors = arguments[0];

    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }

    var data = this.parse(selectors, params);

    this.pipeline.push({
        $redact: data
    })
    //js_parse(jsep(expr,params),params);
    return this;
};
qr.prototype.createView = function (name, options) {

    var ret = db.createView(name, this.name, this.pipeline, options);
    return ret;
};
qr.prototype.info = function () {
    if (this.coll) {
        return db.getCollectionInfos({ name: this.coll._shortName })
    }
    else {
        return db.getCollectionInfos({ name: this.name });
    }


};
qr.prototype.insert = function () {
    var ret = new entity(this, null);
    var isArray = arguments[0].push != undefined;
    if (arguments.length == 1) {
        ret.insert(arguments[0]);
        return ret;
    }
    else {
        var data = [];
        for (var i = 0; i < arguments.length; i++) {
            data.push(arguments[i]);
        }
        ret.insert(data);
        return ret;
    }
};
qr.prototype.push = function (data) {
    var ret = new entity(this);
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$push) {
        ret._updateData.$push = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        ret._updateData.$push[keys[i]] = data[keys[i]];
    }
    return ret;
};
entity.prototype.pullAll = function () {
    var selectors = arguments[0];
    var params = [];
    var ret = new entity(this);
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$pullAll) {
        ret._updateData.$pullAll = {};
    }

    if (typeof selectors == "string") {

        var _expr = js_parse(jsep(selectors, params), params);
        var keys = Object.keys(_expr);
        ret._updateData.$pullAll[keys[0]] = _expr[keys[0]];
        return ret;
    }
    else {
        var _expr = ret._owner.parse(selectors, params, true);
        var keys = Object.keys(_expr);
        for (var i = 0; i < keys.length; i++) {
            ret._updateData.$pullAll[keys[i]] = _expr[keys[i]];
        }
        return ret;
    }
};
qr.prototype.pop = function (data) {
    var ret = new entity(this);
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$pop) {
        ret._updateData.$pop = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        ret._updateData.$pop[keys[i]] = data[keys[i]];
    }
    return ret;
};
qr.prototype.set = function (data) {
    var ret = new entity(this);
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$set) {
        ret._updateData.$set = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] != "_id") {
            ret._updateData.$set[keys[i]] = data[keys[i]];
        }
    }
    return ret;
};
qr.prototype.where = function () {
    var selectors = arguments[0];
    var params = [];
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i]);
    }
    var _expr = js_parse(jsep(selectors, params), params);
    return new entity(this, _expr);
};


qr.prototype.pull = function () {
    var selectors = arguments[0];
    var params = [];
    var ret = new entity(this);
    for (var i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$pull) {
        ret._updateData.$pull = {};
    }
    if (typeof selectors == "string") {

        var _expr = js_parse(jsep(selectors, params), params);
        var keys = Object.keys(_expr);
        ret._updateData.$pull[keys[0]] = _expr[keys[0]];
        return ret;
    }
    else {
        var _expr = ret._owner.parse(selectors, params, true);
        var keys = Object.keys(_expr);
        for (var i = 0; i < keys.length; i++) {
            ret._updateData.$pull[keys[i]] = _expr[keys[i]];
        }
        return ret;
    }
};
/**
 * @returns qr
 */
module.exports=function(){
    if(arguments.length==2){
        return new qr(arguments[0],arguments[1]);
    }
    else if(arguments.length==1){
        return new qr(arguments[0]);
    }
    else{
        return new qr();
    }
    
};