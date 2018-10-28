function js_parse(fx, params, forSelect, forNot, prefix){
    if (!forSelect) {
        forSelect = false;
    }

    if (fx.type == 'Literal') {

        return fx.value;
    }
    var avgFuncs = ";avg;sum;min;max;push;addToSet;strLenBytes;strLenCP;strLenBytes;sqrt;toString;type;last;first;"
    var ret = {};
    var op = {
        "==": "$eq",
        "!=": "$ne",
        ">": "$gt",
        "<": "$lt",
        ">=": "$gte",
        "<=": "$lte",
        "+": "$add",
        "-": "$subtract",
        "*": "$multiply",
        "/": "$divide",
        "%": "$mod",
        "^": "$pow"
    }
    var mathOp = ";$add;$subtract;$multiply;$divide;$mod;";
    var matchOp = ";$eq;$ne;$gt;$lt;$gte;$lte;";
    var logical = {
        "&&": "$and",
        "||": "$or"
    }
    if (fx.type === 'UnaryExpression') {
        if (fx.operator === "-") {
            return -1 * js_parse(fx.argument, params, forSelect, true)
        }
        if (fx.operator === "!") {
            if (forSelect) {
                var ret = { $not: [] };
                ret.$not.push(js_parse(fx.argument, params, forSelect))
                return ret;
            }
            else {
                var ret = js_parse(fx.argument, params, forSelect, true);

                return ret;
            }
        }
    }
    if (fx.type === 'Identifier') {

        if (prefix) {
            return prefix + fx.name;
        }
        else {
            return fx.name;
        }

    }
    if (fx.type === 'MemberExpression') {
        var left = js_parse(fx.object, params, forSelect);
        if (prefix) {
            if (fx.property.name) {
                return prefix + left + "." + fx.property.name;
            }
            else {

                return prefix + left + "." + fx.property.raw;
            }

        }
        else {
            if (fx.property.name) {
                return left + "." + fx.property.name;
            }
            else {
                return left + "." + fx.property.raw;
            }
        }
    }

    if (fx.type === 'BinaryExpression') {
        ret = {}
        var right = js_parse(fx.right, params, true, false, prefix);
        var left = js_parse(fx.left, params, true, false, prefix);

        if (fx.operator == '==') {
            if (typeof left === 'string') {
                if (typeof right == "string" && (!forSelect)) {
                    left = js_parse(fx.left, params, true, false);
                    if (forNot) {
                        ret[left] = {
                            $ne: {
                                $regex: new RegExp("^" + right + "$", "i")
                            }

                        };
                        return ret
                    }
                    else {
                        ret[left] = {
                            $regex: new RegExp("^" + right + "$", "i")

                        };
                        return ret
                    }
                }
                if (!forSelect) {
                    ret = {};
                    left = js_parse(fx.left, params, true, false, prefix);
                    ret[left] = right;
                    return ret;
                }
                else {
                    left = js_parse(fx.left, params, true, false, "$");
                    right = js_parse(fx.right, params, true, false, "$");
                    return {
                        $eq: [left, right]
                    }
                }
            }
            else {

            }
        }
        var mOp = op[fx.operator];
        if (!forSelect && matchOp.indexOf(mOp) > -1) {
            ret = {};
            ret[left] = {};
            ret[left][mOp] = right;
            return ret;

        }
        right = js_parse(fx.right, params, true, false, "$");
        left = js_parse(fx.left, params, true, false, "$");
        ret = {};
        ret[mOp] = [left, right];
        return ret;


    }
    if (fx.type === 'LogicalExpression') {
        var ret = {}
        ret[logical[fx.operator]] = [js_parse(fx.left, params, true), js_parse(fx.right, params, true, forNot)]
        return ret
    }
    if (fx.type === 'BinaryExpression') {

    }
    if (fx.type === 'CallExpression') {
        if (fx.callee.name === "exists") {
            ret = {};
            var left = js_parse(fx.arguments[0], params, true, forNot);

            ret[left] = {
                $exists: (forNot ? false : true)
            }
            return ret;
        }
        if (avgFuncs.indexOf(";" + fx.callee.name + ";") > -1) {
            ret = {};
            ret["$" + fx.callee.name] = js_parse(fx.arguments[0], params, true, false, "$");
            return ret;
        }
        if (fx.callee.name == "getParams") {

            return params[fx.arguments[0].value];
        }
        if (fx.callee.name === 'expr') {
            ret = {
                $expr: js_parse(fx.arguments[0], params, true, forNot, "$")
            };
            return ret
        }
        if (fx.callee.name === "regex") {
            var left = js_parse(fx.arguments[0], params, true, forNot);
            var right = js_parse(fx.arguments[1], params, true, forNot);
            ret = {}
            var p = {};
            // ret=p;
            var items = left.split('.');
            for (var i = 0; i < items.length - 1; i++) {
                p[items[i]] = {};
                p = p[items[i]];
            }

            if (fx.arguments.length == 2) {
                if (forNot) {
                    ret[left] = {
                        $ne: {
                            $regex: new RegExp(right)
                        }
                    };
                }
                else {
                    ret[left] = {
                        $regex: new RegExp(right)
                    };
                }

            }
            else if (fx.arguments.length == 3) {
                ret[left] = {
                    $regex: new RegExp(right, js_parse(fx.arguments[2], params, true, forNot))
                };
            }

            return ret;
        }
        if (fx.callee.name === "iif") {
            return {
                $cond: {
                    "if": js_parse(fx.arguments[0], params, true, forNot, "$"),
                    "then": js_parse(fx.arguments[1], params, true, forNot, "$"),
                    "else": js_parse(fx.arguments[2], params, true, forNot, "$")
                }
            }
        }
        if (fx.callee.name == "switch") {

            ret = {
                $switch: {
                    branches: [],
                    default: js_parse(fx.arguments[fx.arguments.length - 1], params, true, forNot, "$")
                }
            };
            for (var i = 0; i < fx.arguments.length - 1; i++) {
                ret.$switch.branches.push(js_parse(fx.arguments[i], params, true, forNot, "$"));
            }
            return ret;
        }
        if (fx.callee.name == "case") {
            if (fx.arguments.length < 2) {
                throw (new Error("case must have 2 params"))
            }
            return {
                case: js_parse(fx.arguments[0], params, true, false, "$"),
                then: js_parse(fx.arguments[1], params, true, false, "$")
            }
        }
        if (fx.callee.name == "in" && (!forSelect)) {
            var ret = {};

            var field = js_parse(fx.arguments[0], params, true, forNot, "$");
            if (typeof field != "string") {
                throw (new Error("match or where with $in must be begin with field name, not object"))
            }
            ret[field] = {};
            ret[field]["$in"] = js_parse(fx.arguments[1], params, true, forNot, "$");

            return ret;
        }
        if (fx.callee.name === "dateToString") {
            /*
                { 	$dateToString: {
                date: <dateExpression>,
                format: <formatString>,
                timezone: <tzExpression>,
                onNull: <expression>
            } }
            */
            var paramIndexs = ['date', 'format', 'timezone'];
            var ret = {
                $dateToString: {}
            };
            for (var i = 0; i < fx.arguments.length; i++) {
                ret.$dateToString[paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, "$");
            }
            return ret;
        }
        if (fx.callee.name === "dateFromString") {
        	/*
        		{ $dateFromString: {
	   			  dateString: <dateStringExpression>,
				     format: <formatStringExpression>,
			     timezone: <tzExpression>,
			     onError: <onErrorExpression>,
			     onNull: <onNullExpression>
				} }
 	       */
            var paramIndexs = ['dateString', 'format', 'timezone', 'onNull', 'onError'];
            var ret = {
                $dateFromString: {}
            };
            for (var i = 0; i < fx.arguments.length; i++) {
                var val = js_parse(fx.arguments[i], params, true, forNot, "$");
                if (val != null) {
                    ret.$dateFromString[paramIndexs[i]] = val;
                }

            }
            return ret;
        }
        if (fx.callee.name === "dateToParts") {
            /*
                {
                $dateToParts: {
                    'date' : <dateExpression>,
                    'timezone' : <timezone>,
                    'iso8601' : <boolean>
                }
            }
            */
            var paramIndexs = ['date', 'timezone', 'iso8601'];
            var ret = {
                $dateToParts: {}
            };

            for (var i = 0; i < fx.arguments.length; i++) {

                var val = js_parse(fx.arguments[i], params, true, forNot, "$");

                if (val != null) {
                    ret.$dateToParts[paramIndexs[i]] = val;
                }

            }
            return ret;
        }
        if (fx.callee.name == "hour" ||
            fx.callee.name == "minute" ||
            fx.callee.name == "dayOfMonth" ||
            fx.callee.name == "dayOfYear" ||
            fx.callee.name == "second") {
            var paramIndexs = ["date", "timezone"]
            var ret = {};
            ret["$" + fx.callee.name] = {}
            for (var i = 0; i < fx.arguments.length; i++) {
                ret["$" + fx.callee.name][paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, "$");
            }
            return ret;
        }
        if (fx.callee.name == "dateFromParts") {
            var paramIndexs = ["year", "month", "day", "hour", "minute", "second", "millisecond", "timezone"];
            var ret = { $dateFromParts: {} };
            for (var i = 0; i < fx.arguments.length; i++) {
                var val = js_parse(fx.arguments[i], params, true, forNot, "$");
                if (val != null) {
                    ret.$dateFromParts[paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, "$");
                }

            }
            return ret;
        }
        if (fx.callee.name == "rtrim" ||
            fx.callee.name == "ltrim") {
            var paramIndexs = ["input", "chars"]
            var ret = {};
            ret["$" + fx.callee.name] = {}
            for (var i = 0; i < fx.arguments.length; i++) {
                ret["$" + fx.callee.name][paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, "$");
            }
            return ret;
        }
        if (fx.callee.name === "ceil") {
            return {
                $ceil: js_parse(fx.arguments[0], params, true, forNot, "$")
            }
        }
        if (fx.callee.name === "arrayToObject" ||
            fx.callee.name == "reverseArray") {
            var ret = {};
            ret["$" + fx.callee.name] = js_parse(fx.arguments[0], params, true, forNot, "$");
            return ret;
        }
        if (fx.callee.name == "reduce") {
            /*
                    {
                       $reduce: {
                          input: [ [ 3, 4 ], [ 5, 6 ] ],
                          initialValue: [ 1, 2 ],
                          in: { $concatArrays : ["$$value", "$$this"] }
                       }
                    }
            */
            var paramIndexs = ["input", "initialValue", "in"]
            var ret = {};
            ret["$" + fx.callee.name] = {}
            for (var i = 0; i < fx.arguments.length; i++) {
                ret["$" + fx.callee.name][paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, "$");
            }
            return ret;
        }
        if (fx.callee.name === "convert") {
            /*
                {
               $convert:
                  {
                     input: <expression>,
                     to: <type expression>,
                     onError: <expression>,  // Optional.
                     onNull: <expression>    // Optional.
                     }
            }
            */
            var paramIndexs = ['input', 'to', 'onNull', 'onError'];
            var ret = {
                $convert: {}
            };
            for (var i = 0; i < fx.arguments.length; i++) {
                var val = js_parse(fx.arguments[i], params, true, forNot, "$");
                if (val != null) {
                    ret.$convert[paramIndexs[i]] = val;
                }

            }
            return ret;
        }
        if (fx.callee.name === "filter") {
            //{ $filter: { input: <array>, as: <string>, cond: <expression> } }
            var paramIndexs = ['input', 'as', 'cond'];
            var prefix = ["$", undefined, "$"];
            var ret = {
                $filter: {}
            }
            for (var i = 0; i < fx.arguments.length; i++) {
                ret.$filter[paramIndexs[i]] = js_parse(fx.arguments[i], params, true, forNot, prefix[i]);
            }
            return ret;
        }
        if (fx.callee.name === "type") {
            if (fx.arguments.length == 2) {
                var field = js_parse(fx.arguments[0], params, true, forNot, "$");
                var val = js_parse(fx.arguments[1], params, true, forNot, "$");
                var ret = {};

                if (forNot) {
                    ret[field] = {
                        $not: {
                            $type: val
                        }
                    };
                    return ret;
                }
                ret[field] = {
                    $type: val
                };
                return ret;
            }
            else {
                return {
                    $type: js_parse(fx.arguments[0], params, true, forNot, "$")
                }
            }
        }
        else if (fx.callee.name === "size") {
            return {
                $size: js_parse(fx.arguments[0], params, true, forNot, "$")
            }
        }
        else if (fx.callee.name == 'mergeObjects') {
            if (fx.arguments.length === 1) {
                return {
                    $mergeObjects: js_parse(fx.arguments[0], params, true, forNot, "$")
                }
            }
            else {
                var ret = {
                    $mergeObjects: []
                }
                for (var i = 0; i < fx.arguments.length; i++) {
                    ret.$mergeObjects.push(js_parse(fx.arguments[i], params, true, forNot, "$"))
                }
                return ret;
            }
        }
        else {
            ret = {};
            var args = [];
            for (var i = 0; i < fx.arguments.length; i++) {
                args.push(js_parse(fx.arguments[i], params, true, forNot, "$"))
            }
            ret["$" + fx.callee.name] = args;
            return ret;
        }
    }
}
module.exports=js_parse;