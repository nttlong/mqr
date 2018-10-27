var errors_parse =require("./errors_parse");
function entity(qr, _expr) {
    this._owner = qr;
    


    this._expr = _expr;
}
entity.prototype.items = function () {
    if (this._expr) {
        return this.coll.find(this._expr);
    }
    else {
        return this.coll.find({});
    }
};
entity.prototype.item = function () {
    if (this._expr) {
        return this.coll.findOne(this._expr);
    }
    else {
        return this.coll.findOne({});
    }
};
entity.prototype.out = function (collectionName) {
    var ret={};
    if (this._expr) {
        ret = this.coll.aggregate([
            {
                $match: this._expr
            },
            {
                $out: collectionName
            }
        ]);
        return new query(collectionName);
    }
    else {
        ret = this.coll.aggregate([

            {
                $out: collectionName
            }
        ]);
        return new query(collectionName);
    }
};
entity.prototype.count = function () {
    var ret={};
    if (this._expr) {
        ret = this.coll.aggregate([
            {
                $match: this._expr
            },
            {
                $count: "retCount"
            }
        ]).toArray();
        if (ret.length == 0) {
            return 0;
        }
        else {
            return ret[0].retCount;
        }
    }
    else {
        ret = this.coll.aggregate([

            {
                $count: "ret"
            }
        ]).toArray();
        if (ret.length == 0) {
            return 0;
        }
        else {
            return ret[0].retCount;
        }
    }
};
entity.prototype.commit = function () {
    var cb = null;
    var db=this._owner.db;
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
    me.coll=db.collection(me._owner.name);
    function run(cb) {
        if (me._insertItem != null) {
            return me.coll.insertOne(me._insertItem,function(e,r){
                if (r && r.insertedId){
                    me._insertItem._id=r.insertedId;
                }
                var ret = errors_parse.getError(db,me.name, e, me._insertItem);
                if(ret){
                    cb(ret);
                }
                else {
                    cb(null, me._insertItem);
                }
                
            });
        }
        if (me._insertItems != null) {
            return me.coll.insertMany(me._insertItems,function(e,r){
                var ret = errors_parse.getError(db,me._owner.name, e, me._insertItems);
                if(ret!=null){
                    cb(ret);
                }
                else {
                    cb(null, data);
                }
            });
        }
        if (me._updateData) {
            if (me._expr) {
                return me.coll.updateMany(me._expr, me._updateData,function(e,r){
                    var ret = errors_parse.getError(db,me.name, e, me._updateData);
                    if (ret) {
                        cb(ret);
                    }
                    else {
                        cb(null, ret.data);
                    }
                });
            }
            else {
                return me.coll.updateMany({}, me._updateData,function(e,r){
                    var ret = errors_parse.getError(db,me.name, e, me._updateData);
                    if (ret) {
                        cb(ret);
                    }
                    else {
                        cb(null, me._updateData);
                    }
                });
            }
        }
    }
    if(cb){
        run(cb);
    }
    else {
        return require("./sync").sync(run,[]);
    }
    
};
entity.prototype.insert = function () {
    this._insertItem = null;
    this._insertItems = null;
    var isArray = arguments[0].push != undefined;
    if (isArray) {
        this._insertItems = arguments[0];
        return this;
    }
    if (arguments.length == 1) {
        this._insertItem = arguments[0];
    }
    else {
        this._insertItems = [];
        for (var i = 0; i < arguments.length; i++) {
            this._insertItems.push(arguments[i]);
        }
        return this;
    }

};
entity.prototype.unset = function (data) {
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$unset) {
        this._updateData.$unset = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] != "_id") {
            this._updateData.$unset[keys[i]] = data[keys[i]];
        }
    }
    return this;
};
entity.prototype.set = function (data) {
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$set) {
        this._updateData.$set = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] != "_id") {
            this._updateData.$set[keys[i]] = data[keys[i]];
        }
    }
    return this;
};
entity.prototype.info = function () {
    return db.getCollectionInfos({ name: this.coll._shortName })

};
entity.prototype.push = function (data) {
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$push) {
        this._updateData.$push = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        this._updateData.$push[keys[i]] = data[keys[i]];
    }
    return this;
};
entity.prototype.delete = function () {
    if (!this._expr) {
        throw (new Error("Can not delete data without where"))
    }
    return this.coll.deleteMany(this._expr);
};
entity.prototype.pullAll = function () {
    var selectors = arguments[0];
    var params = [];
    var _expr = {};
    var keys=[];
    var i=0;

    for (i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$pullAll) {
        this._updateData.$pullAll = {};
    }
    if (typeof selectors == "string") {

        _expr = js_parse(jsep(selectors, params), params);
        keys = Object.keys(_expr);
        this._updateData.$pullAll[keys[0]] = _expr[keys[0]];
        return this;
    }
    else {
        _expr = this._owner.parse(selectors, params, true);
        keys = Object.keys(_expr);
        for (i = 0; i < keys.length; i++) {
            this._updateData.$pullAll[keys[i]] = _expr[keys[i]];
        }
        return this;
    }
};
entity.prototype.pull = function () {
    var selectors = arguments[0];
    var params = [];
    var _expr={};
    var keys=[];
    var i=0;

    for (i = 1; i < arguments.length; i++) {
        params.push(arguments[i])
    }
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$pull) {
        this._updateData.$pull = {};
    }
    if (typeof selectors == "string") {

        _expr = js_parse(jsep(selectors, params), params);
        keys = Object.keys(_expr);
        this._updateData.$pull[keys[0]] = _expr[keys[0]];
        return this;
    }
    else {
        _expr = this._owner.parse(selectors, params, true);
        keys = Object.keys(_expr);
        for (i = 0; i < keys.length; i++) {
            this._updateData.$pull[keys[i]] = _expr[keys[i]];
        }
        return this;
    }
};
entity.prototype.addToSet = function (data) {
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$addToSet) {
        this._updateData.$addToSet = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        this._updateData.$addToSet[keys[i]] = data[keys[i]];
    }
    return this;
};
entity.prototype.pop = function (data) {
    if (!this._updateData) {
        this._updateData = {};
    }
    if (!this._updateData.$pop) {
        this._updateData.$pop = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        this._updateData.$pop[keys[i]] = data[keys[i]];
    }
    return this;
};
entity.prototype.addToSet = function (data) {
    var ret = new entity(this);
    if (!ret._updateData) {
        ret._updateData = {};
    }
    if (!ret._updateData.$addToSet) {
        ret._updateData.$addToSet = {};
    }
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        ret._updateData.$addToSet[keys[i]] = data[keys[i]];
    }
    return ret;
};
module.exports=entity;