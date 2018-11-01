db.system.js.save({
_id:"findCollection",
value:function(name){
  	var ret=db.getCollectionNames()
  	var list=[];
	var find=false;
	for(var i=0;i<ret.length;i++){
	  	if(ret[i].toLowerCase().indexOf(name.toLowerCase())>-1){
	  	  	list.push(ret[i]);
	  	}
	}
	return list;
}})
db.system.js.save({
_id:"isExistsCollection",
value:function(name){
  	var ret=db.getCollectionNames()
  	for(var i=0;i<ret.length;i++){
	  	if(ret[i].toLowerCase()==name.toLowerCase()){
	  	  	return true
	  	}
	}
	return false;
}})
db.system.js.save({
  _id:"model",
  value:function(name,required,properties){
    var listOfCollections=db.getCollectionNames()
  	var isExists=false;
	
	for(var i=0;i<listOfCollections.length;i++){
	  	if(listOfCollections[i].toLowerCase()==name.toLowerCase()){
	  	  	isExists= true;
	  	  	break;
	  	}
	}
	if(!isExists){
    var ret= db.createCollection(name, {
   		validator: {
     		 $jsonSchema: {
         					bsonType: "object",
         					required: required,
            				properties: properties
      						}
   					}
	})
	return ret;
	}
	else {
	  var ret=db.runCommand({
   			collMod: name,
   			validator: { 
   				$jsonSchema: {
         					bsonType: "object",
         					required: required,
            				properties: properties
      						}
   					}
   			});
	  }
	  return ret;
	}
  }
)
db.system.js.save({
  _id:"defineFunc",
  value:function(name,fn){
		db.system.js.save({
		  	_id:name,
		  	value:fn
		});  
		db.loadServerScripts();  
  }
})
db.system.js.save(
	{
	  _id: "jsep",
	  value : function(txt,params) {
	      if(!params){
	          params=[]
	      }
	      for(var i=0;i<params.length;i++){
	         
	          while(txt.indexOf("{"+(i)+"}")>-1){
	              
	              txt=txt.replace("{"+(i)+"}","getParams("+i+")");
	             
	          }
	      }
	
		 function init_jsep(root) {
			 'use strict';
			 // Node Types
			 // ----------
 
			 // This is the full set of types that any JSEP node can be.
			 // Store them here to save space when minified
			 var COMPOUND = 'Compound',
				 IDENTIFIER = 'Identifier',
				 MEMBER_EXP = 'MemberExpression',
				 LITERAL = 'Literal',
				 THIS_EXP = 'ThisExpression',
				 CALL_EXP = 'CallExpression',
				 UNARY_EXP = 'UnaryExpression',
				 BINARY_EXP = 'BinaryExpression',
				 LOGICAL_EXP = 'LogicalExpression',
				 CONDITIONAL_EXP = 'ConditionalExpression',
				 ARRAY_EXP = 'ArrayExpression',
 
				 PERIOD_CODE = 46, // '.'
				 COMMA_CODE  = 44, // ','
				 SQUOTE_CODE = 39, // single quote
				 DQUOTE_CODE = 34, // double quotes
				 OPAREN_CODE = 40, // (
				 CPAREN_CODE = 41, // )
				 OBRACK_CODE = 91, // [
				 CBRACK_CODE = 93, // ]
				 QUMARK_CODE = 63, // ?
				 SEMCOL_CODE = 59, // ;
				 COLON_CODE  = 58, // :
 
				 throwError = function(message, index) {
					 var error = new Error(message + ' at character ' + index);
					 error.index = index;
					 error.description = message;
					 throw error;
				 },
 
			 // Operations
			 // ----------
 
			 // Set `t` to `true` to save space (when minified, not gzipped)
				 t = true,
			 // Use a quickly-accessible map to store all of the unary operators
			 // Values are set to `true` (it really doesn't matter)
				 unary_ops = {'-': t, '!': t, '~': t, '+': t},
			 // Also use a map for the binary operations but set their values to their
			 // binary precedence for quick reference:
			 // see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
				 binary_ops = {
					 '||': 1, '&&': 2, '|': 3,  '^': 4,  '&': 5,
					 '==': 6, '!=': 6, '===': 6, '!==': 6,
					 '<': 7,  '>': 7,  '<=': 7,  '>=': 7,
					 '<<':8,  '>>': 8, '>>>': 8,
					 '+': 9, '-': 9,
					 '*': 10, '/': 10, '%': 10
				 },
			 // Get return the longest key length of any object
				 getMaxKeyLen = function(obj) {
					 var max_len = 0, len;
					 for(var key in obj) {
						 if((len = key.length) > max_len && obj.hasOwnProperty(key)) {
							 max_len = len;
						 }
					 }
					 return max_len;
				 },
				 max_unop_len = getMaxKeyLen(unary_ops),
				 max_binop_len = getMaxKeyLen(binary_ops),
			 // Literals
			 // ----------
			 // Store the values to return for the various literals we may encounter
				 literals = {
					 'true': true,
					 'false': false,
					 'null': null
				 },
			 // Except for `this`, which is special. This could be changed to something like `'self'` as well
				 this_str = 'this',
			 // Returns the precedence of a binary operator or `0` if it isn't a binary operator
				 binaryPrecedence = function(op_val) {
					 return binary_ops[op_val] || 0;
				 },
			 // Utility function (gets called from multiple places)
			 // Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
				 createBinaryExpression = function (operator, left, right) {
					 var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
					 return {
						 type: type,
						 operator: operator,
						 left: left,
						 right: right
					 };
				 },
				 // `ch` is a character code in the next three functions
				 isDecimalDigit = function(ch) {
					 return (ch >= 48 && ch <= 57); // 0...9
				 },
				 isIdentifierStart = function(ch) {
					 return (ch === 36) || (ch === 95) || // `$` and `_`
							 (ch >= 65 && ch <= 90) || // A...Z
							 (ch >= 97 && ch <= 122) || // a...z
							 (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
				 },
				 isIdentifierPart = function(ch) {
					 return (ch === 36) || (ch === 95) || // `$` and `_`
							 (ch >= 65 && ch <= 90) || // A...Z
							 (ch >= 97 && ch <= 122) || // a...z
							 (ch >= 48 && ch <= 57) || // 0...9
							 (ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
				 },
 
				 // Parsing
				 // -------
				 // `expr` is a string with the passed in expression
				 jsep = function(expr) {
					 // `index` stores the character number we are currently at while `length` is a constant
					 // All of the gobbles below will modify `index` as we move along
					 var index = 0,
						 charAtFunc = expr.charAt,
						 charCodeAtFunc = expr.charCodeAt,
						 exprI = function(i) { return charAtFunc.call(expr, i); },
						 exprICode = function(i) { return charCodeAtFunc.call(expr, i); },
						 length = expr.length,
 
						 // Push `index` up to the next non-space character
						 gobbleSpaces = function() {
							 var ch = exprICode(index);
							 // space or tab
							 while(ch === 32 || ch === 9 || ch === 10 || ch === 13) {
								 ch = exprICode(++index);
							 }
						 },
 
						 // The main parsing function. Much of this code is dedicated to ternary expressions
						 gobbleExpression = function() {
							 var test = gobbleBinaryExpression(),
								 consequent, alternate;
							 gobbleSpaces();
							 if(exprICode(index) === QUMARK_CODE) {
								 // Ternary expression: test ? consequent : alternate
								 index++;
								 consequent = gobbleExpression();
								 if(!consequent) {
									 throwError('Expected expression', index);
								 }
								 gobbleSpaces();
								 if(exprICode(index) === COLON_CODE) {
									 index++;
									 alternate = gobbleExpression();
									 if(!alternate) {
										 throwError('Expected expression', index);
									 }
									 return {
										 type: CONDITIONAL_EXP,
										 test: test,
										 consequent: consequent,
										 alternate: alternate
									 };
								 } else {
									 throwError('Expected :', index);
								 }
							 } else {
								 return test;
							 }
						 },
 
						 // Search for the operation portion of the string (e.g. `+`, `===`)
						 // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
						 // and move down from 3 to 2 to 1 character until a matching binary operation is found
						 // then, return that binary operation
						 gobbleBinaryOp = function() {
							 gobbleSpaces();
							 var biop, to_check = expr.substr(index, max_binop_len), tc_len = to_check.length;
							 while(tc_len > 0) {
								 // Don't accept a binary op when it is an identifier.
								 // Binary ops that start with a identifier-valid character must be followed
								 // by a non identifier-part valid character
								 if(binary_ops.hasOwnProperty(to_check) && (
									 !isIdentifierStart(exprICode(index)) ||
									 (index+to_check.length< expr.length && !isIdentifierPart(exprICode(index+to_check.length)))
								 )) {
									 index += tc_len;
									 return to_check;
								 }
								 to_check = to_check.substr(0, --tc_len);
							 }
							 return false;
						 },
 
						 // This function is responsible for gobbling an individual expression,
						 // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
						 gobbleBinaryExpression = function() {
							 var ch_i, node, biop, prec, stack, biop_info, left, right, i;
 
							 // First, try to get the leftmost thing
							 // Then, check to see if there's a binary operator operating on that leftmost thing
							 left = gobbleToken();
							 biop = gobbleBinaryOp();
 
							 // If there wasn't a binary operator, just return the leftmost node
							 if(!biop) {
								 return left;
							 }
 
							 // Otherwise, we need to start a stack to properly place the binary operations in their
							 // precedence structure
							 biop_info = { value: biop, prec: binaryPrecedence(biop)};
 
							 right = gobbleToken();
							 if(!right) {
								 throwError("Expected expression after " + biop, index);
							 }
							 stack = [left, biop_info, right];
 
							 // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
							 while((biop = gobbleBinaryOp())) {
								 prec = binaryPrecedence(biop);
 
								 if(prec === 0) {
									 break;
								 }
								 biop_info = { value: biop, prec: prec };
 
								 // Reduce: make a binary expression from the three topmost entries.
								 while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
									 right = stack.pop();
									 biop = stack.pop().value;
									 left = stack.pop();
									 node = createBinaryExpression(biop, left, right);
									 stack.push(node);
								 }
 
								 node = gobbleToken();
								 if(!node) {
									 throwError("Expected expression after " + biop, index);
								 }
								 stack.push(biop_info, node);
							 }
 
							 i = stack.length - 1;
							 node = stack[i];
							 while(i > 1) {
								 node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
								 i -= 2;
							 }
							 return node;
						 },
 
						 // An individual part of a binary expression:
						 // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
						 gobbleToken = function() {
							 var ch, to_check, tc_len;
 
							 gobbleSpaces();
							 ch = exprICode(index);
 
							 if(isDecimalDigit(ch) || ch === PERIOD_CODE) {
								 // Char code 46 is a dot `.` which can start off a numeric literal
								 return gobbleNumericLiteral();
							 } else if(ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
								 // Single or double quotes
								 return gobbleStringLiteral();
							 } else if (ch === OBRACK_CODE) {
								 return gobbleArray();
							 } else {
								 to_check = expr.substr(index, max_unop_len);
								 tc_len = to_check.length;
								 while(tc_len > 0) {
								 // Don't accept an unary op when it is an identifier.
								 // Unary ops that start with a identifier-valid character must be followed
								 // by a non identifier-part valid character
									 if(unary_ops.hasOwnProperty(to_check) && (
										 !isIdentifierStart(exprICode(index)) ||
										 (index+to_check.length < expr.length && !isIdentifierPart(exprICode(index+to_check.length)))
									 )) {
										 index += tc_len;
										 return {
											 type: UNARY_EXP,
											 operator: to_check,
											 argument: gobbleToken(),
											 prefix: true
										 };
									 }
									 to_check = to_check.substr(0, --tc_len);
								 }
 
								 if (isIdentifierStart(ch) || ch === OPAREN_CODE) { // open parenthesis
									 // `foo`, `bar.baz`
									 return gobbleVariable();
								 }
							 }
 
							 return false;
						 },
						 // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
						 // keep track of everything in the numeric literal and then calling `parseFloat` on that string
						 gobbleNumericLiteral = function() {
							 var number = '', ch, chCode;
							 while(isDecimalDigit(exprICode(index))) {
								 number += exprI(index++);
							 }
 
							 if(exprICode(index) === PERIOD_CODE) { // can start with a decimal marker
								 number += exprI(index++);
 
								 while(isDecimalDigit(exprICode(index))) {
									 number += exprI(index++);
								 }
							 }
 
							 ch = exprI(index);
							 if(ch === 'e' || ch === 'E') { // exponent marker
								 number += exprI(index++);
								 ch = exprI(index);
								 if(ch === '+' || ch === '-') { // exponent sign
									 number += exprI(index++);
								 }
								 while(isDecimalDigit(exprICode(index))) { //exponent itself
									 number += exprI(index++);
								 }
								 if(!isDecimalDigit(exprICode(index-1)) ) {
									 throwError('Expected exponent (' + number + exprI(index) + ')', index);
								 }
							 }
 
 
							 chCode = exprICode(index);
							 // Check to make sure this isn't a variable name that start with a number (123abc)
							 if(isIdentifierStart(chCode)) {
								 throwError('Variable names cannot start with a number (' +
											 number + exprI(index) + ')', index);
							 } else if(chCode === PERIOD_CODE) {
								 throwError('Unexpected period', index);
							 }
 
							 return {
								 type: LITERAL,
								 value: parseFloat(number),
								 raw: number
							 };
						 },
 
						 // Parses a string literal, staring with single or double quotes with basic support for escape codes
						 // e.g. `"hello world"`, `'this is\nJSEP'`
						 gobbleStringLiteral = function() {
							 var str = '', quote = exprI(index++), closed = false, ch;
 
							 while(index < length) {
								 ch = exprI(index++);
								 if(ch === quote) {
									 closed = true;
									 break;
								 } else if(ch === '\\') {
									 // Check for all of the common escape codes
									 ch = exprI(index++);
									 switch(ch) {
										 case 'n': str += '\n'; break;
										 case 'r': str += '\r'; break;
										 case 't': str += '\t'; break;
										 case 'b': str += '\b'; break;
										 case 'f': str += '\f'; break;
										 case 'v': str += '\x0B'; break;
										 default : str += ch;
									 }
								 } else {
									 str += ch;
								 }
							 }
 
							 if(!closed) {
								 throwError('Unclosed quote after "'+str+'"', index);
							 }
 
							 return {
								 type: LITERAL,
								 value: str,
								 raw: quote + str + quote
							 };
						 },
 
						 // Gobbles only identifiers
						 // e.g.: `foo`, `_value`, `$x1`
						 // Also, this function checks if that identifier is a literal:
						 // (e.g. `true`, `false`, `null`) or `this`
						 gobbleIdentifier = function() {
							 var ch = exprICode(index), start = index, identifier;
 
							 if(isIdentifierStart(ch)) {
								 index++;
							 } else {
								 throwError('Unexpected ' + exprI(index), index);
							 }
 
							 while(index < length) {
								 ch = exprICode(index);
								 if(isIdentifierPart(ch)) {
									 index++;
								 } else {
									 break;
								 }
							 }
							 identifier = expr.slice(start, index);
 
							 if(literals.hasOwnProperty(identifier)) {
								 return {
									 type: LITERAL,
									 value: literals[identifier],
									 raw: identifier
								 };
							 } else if(identifier === this_str) {
								 return { type: THIS_EXP };
							 } else {
								 return {
									 type: IDENTIFIER,
									 name: identifier
								 };
							 }
						 },
 
						 // Gobbles a list of arguments within the context of a function call
						 // or array literal. This function also assumes that the opening character
						 // `(` or `[` has already been gobbled, and gobbles expressions and commas
						 // until the terminator character `)` or `]` is encountered.
						 // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
						 gobbleArguments = function(termination) {
							 var ch_i, args = [], node, closed = false;
							 while(index < length) {
								 gobbleSpaces();
								 ch_i = exprICode(index);
								 if(ch_i === termination) { // done parsing
									 closed = true;
									 index++;
									 break;
								 } else if (ch_i === COMMA_CODE) { // between expressions
									 index++;
								 } else {
									 node = gobbleExpression();
									 if(!node || node.type === COMPOUND) {
										 throwError('Expected comma', index);
									 }
									 args.push(node);
								 }
							 }
							 if (!closed) {
								 throwError('Expected ' + String.fromCharCode(termination), index);
							 }
							 return args;
						 },
 
						 // Gobble a non-literal variable name. This variable name may include properties
						 // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
						 // It also gobbles function calls:
						 // e.g. `Math.acos(obj.angle)`
						 gobbleVariable = function() {
							 var ch_i, node;
							 ch_i = exprICode(index);
 
							 if(ch_i === OPAREN_CODE) {
								 node = gobbleGroup();
							 } else {
								 node = gobbleIdentifier();
							 }
							 gobbleSpaces();
							 ch_i = exprICode(index);
							 while(ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
								 index++;
								 if(ch_i === PERIOD_CODE) {
									 gobbleSpaces();
									 node = {
										 type: MEMBER_EXP,
										 computed: false,
										 object: node,
										 property: gobbleIdentifier()
									 };
								 } else if(ch_i === OBRACK_CODE) {
									 node = {
										 type: MEMBER_EXP,
										 computed: true,
										 object: node,
										 property: gobbleExpression()
									 };
									 gobbleSpaces();
									 ch_i = exprICode(index);
									 if(ch_i !== CBRACK_CODE) {
										 throwError('Unclosed [', index);
									 }
									 index++;
								 } else if(ch_i === OPAREN_CODE) {
									 // A function call is being made; gobble all the arguments
									 node = {
										 type: CALL_EXP,
										 'arguments': gobbleArguments(CPAREN_CODE),
										 callee: node
									 };
								 }
								 gobbleSpaces();
								 ch_i = exprICode(index);
							 }
							 return node;
						 },
 
						 // Responsible for parsing a group of things within parentheses `()`
						 // This function assumes that it needs to gobble the opening parenthesis
						 // and then tries to gobble everything within that parenthesis, assuming
						 // that the next thing it should see is the close parenthesis. If not,
						 // then the expression probably doesn't have a `)`
						 gobbleGroup = function() {
							 index++;
							 var node = gobbleExpression();
							 gobbleSpaces();
							 if(exprICode(index) === CPAREN_CODE) {
								 index++;
								 return node;
							 } else {
								 throwError('Unclosed (', index);
							 }
						 },
 
						 // Responsible for parsing Array literals `[1, 2, 3]`
						 // This function assumes that it needs to gobble the opening bracket
						 // and then tries to gobble the expressions as arguments.
						 gobbleArray = function() {
							 index++;
							 return {
								 type: ARRAY_EXP,
								 elements: gobbleArguments(CBRACK_CODE)
							 };
						 },
 
						 nodes = [], ch_i, node;
 
					 while(index < length) {
						 ch_i = exprICode(index);
 
						 // Expressions can be separated by semicolons, commas, or just inferred without any
						 // separators
						 if(ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
							 index++; // ignore separators
						 } else {
							 // Try to gobble each expression individually
							 if((node = gobbleExpression())) {
								 nodes.push(node);
							 // If we weren't able to find a binary expression and are out of room, then
							 // the expression passed in probably has too much
							 } else if(index < length) {
								 throwError('Unexpected "' + exprI(index) + '"', index);
							 }
						 }
					 }
 
					 // If there's only one expression just try returning the expression
					 if(nodes.length === 1) {
						 return nodes[0];
					 } else {
						 return {
							 type: COMPOUND,
							 body: nodes
						 };
					 }
				 };
 
			 // To be filled in by the template
			 jsep.version = '0.3.4';
			 jsep.toString = function() { return 'JavaScript Expression Parser (JSEP) v' + jsep.version; };
 
			 /**
			  * @method jsep.addUnaryOp
			  * @param {string} op_name The name of the unary op to add
			  * @return jsep
			  */
			 jsep.addUnaryOp = function(op_name) {
				 max_unop_len = Math.max(op_name.length, max_unop_len);
				 unary_ops[op_name] = t; return this;
			 };
 
			 /**
			  * @method jsep.addBinaryOp
			  * @param {string} op_name The name of the binary op to add
			  * @param {number} precedence The precedence of the binary op (can be a float)
			  * @return jsep
			  */
			 jsep.addBinaryOp = function(op_name, precedence) {
				 max_binop_len = Math.max(op_name.length, max_binop_len);
				 binary_ops[op_name] = precedence;
				 return this;
			 };
 
			 /**
			  * @method jsep.addLiteral
			  * @param {string} literal_name The name of the literal to add
			  * @param {*} literal_value The value of the literal
			  * @return jsep
			  */
			 jsep.addLiteral = function(literal_name, literal_value) {
				 literals[literal_name] = literal_value;
				 return this;
			 };
 
			 /**
			  * @method jsep.removeUnaryOp
			  * @param {string} op_name The name of the unary op to remove
			  * @return jsep
			  */
			 jsep.removeUnaryOp = function(op_name) {
				 delete unary_ops[op_name];
				 if(op_name.length === max_unop_len) {
					 max_unop_len = getMaxKeyLen(unary_ops);
				 }
				 return this;
			 };
 
			 /**
			  * @method jsep.removeAllUnaryOps
			  * @return jsep
			  */
			 jsep.removeAllUnaryOps = function() {
				 unary_ops = {};
				 max_unop_len = 0;
 
				 return this;
			 };
 
			 /**
			  * @method jsep.removeBinaryOp
			  * @param {string} op_name The name of the binary op to remove
			  * @return jsep
			  */
			 jsep.removeBinaryOp = function(op_name) {
				 delete binary_ops[op_name];
				 if(op_name.length === max_binop_len) {
					 max_binop_len = getMaxKeyLen(binary_ops);
				 }
				 return this;
			 };
 
			 /**
			  * @method jsep.removeAllBinaryOps
			  * @return jsep
			  */
			 jsep.removeAllBinaryOps = function() {
				 binary_ops = {};
				 max_binop_len = 0;
 
				 return this;
			 };
 
			 /**
			  * @method jsep.removeLiteral
			  * @param {string} literal_name The name of the literal to remove
			  * @return jsep
			  */
			 jsep.removeLiteral = function(literal_name) {
				 delete literals[literal_name];
				 return this;
			 };
 
			 /**
			  * @method jsep.removeAllLiterals
			  * @return jsep
			  */
			 jsep.removeAllLiterals = function() {
				 literals = {};
 
				 return this;
			 };
 
			 return jsep;
		 }
		 
		 var ret=init_jsep(ret)(txt);
		 return ret
 
	  }
	}
 )
db.system.js.save({
    _id:"js_parse",
    value:function(fx,params,forSelect,forNot,prefix){
         if(!forSelect) {
        forSelect=false;
    }
    
    if(fx.type=='Literal'){
        
        return fx.value;
    }
    var avgFuncs=";avg;sum;min;max;push;addToSet;strLenBytes;strLenCP;strLenBytes;sqrt;toString;type;last;first;literal;"
    var ret={};
    var op={
        "==":"$eq",
        "!=":"$ne",
        ">":"$gt",
        "<":"$lt",
        ">=":"$gte",
        "<=":"$lte",
        "+":"$add",
        "-":"$subtract",
        "*":"$multiply",
        "/":"$divide",
        "%":"$mod",
        "^":"$pow"
    }
    var mathOp=";$add;$subtract;$multiply;$divide;$mod;";
    var matchOp=";$eq;$ne;$gt;$lt;$gte;$lte;";
    var logical={
        "&&":"$and",
        "||":"$or"
    }
    if(fx.type==='UnaryExpression'){
       if(fx.operator==="-"){ 
            return -1*js_parse(fx.argument,params,forSelect,true)
       }
       if(fx.operator==="!"){
         if(forSelect){
           	var ret={$not:[]};
           	ret.$not.push(js_parse(fx.argument,params,forSelect))
           	return ret;
         }
         else {
         	var ret=js_parse(fx.argument,params,forSelect,true);
         	
         	return ret;
         }
       }
    }
    if(fx.type==='Identifier'){
       
       if(prefix){
         return prefix+fx.name;
       }
       else{
         return fx.name;
       }
        
    }
    if(fx.type==='MemberExpression'){
        var left=js_parse(fx.object,params,forSelect);
        if(prefix){
          if(fx.property.name){
            	return prefix+left+"."+fx.property.name;
          }
          else {
            
            return prefix+left+"."+fx.property.raw;
          }
        	
        }
        else {
          if(fx.property.name){
             return left+"."+fx.property.name;
          }
          else {
            return left+"."+fx.property.raw;
          }
        }
    }
    
    if(fx.type==='BinaryExpression'){
        ret={}
        var right = js_parse(fx.right,params,true,false,prefix);
        var left = js_parse(fx.left,params,true,false,prefix);
      
        if(fx.operator=='=='){
        	if(typeof left==='string'){
            	if(typeof right=="string" && (!forSelect)){
            	    left = js_parse(fx.left,params,true,false);
                    if(forNot){
                        ret[left]={
                            $ne:{
                     	        $regex:new RegExp("^"+right+"$","i")
                            }
                        
                    	};
                    	return ret
                    }
                    else {
                    	ret[left]={
                     	   $regex:new RegExp("^"+right+"$","i")
                        
                    	};
                    	return ret
                    }
            	}
            	if(!forSelect){
             	 	ret={};
             	 	left = js_parse(fx.left,params,true,false,prefix);
              		ret[left]=right;
              		return  ret;
            	}
            	else {
            	  left = js_parse(fx.left,params,true,false,"$");
            	  right = js_parse(fx.right,params,true,false,"$");
            	  return {
            	     $eq:[left,right]
            	  }
            	}
        	}
        	else {
        	   
        	}
        }
        var mOp=op[fx.operator];
        if(!forSelect && matchOp.indexOf(mOp)>-1){
            ret={};
            ret[left]={};
            ret[left][mOp]=right;
            return ret;
            
        }
         right = js_parse(fx.right,params,true,false,"$");
         left = js_parse(fx.left,params,true,false,"$");
        ret={};
        ret[mOp]=[left,right];
            return ret;
        
        
    }
    if(fx.type==='LogicalExpression'){
        var ret={}
        ret[logical[fx.operator]]=[js_parse(fx.left,params,true),js_parse(fx.right,params,true,forNot)]
        return ret
    }
    if(fx.type==='BinaryExpression'){
        
    }
    if(fx.type==='CallExpression'){
        if(fx.callee.name==="exists"){
           ret={};
           var left=js_parse(fx.arguments[0],params,true,forNot);
          
            ret[left]={
                $exists:(forNot?false:true)
            }
            return ret;
        }
        if(avgFuncs.indexOf(";"+fx.callee.name+";")>-1){
            ret={};
            ret["$"+fx.callee.name]=js_parse(fx.arguments[0],params,true,false,"$");
            return ret;
        }
        if(fx.callee.name=="getParams"){
           
          return params[fx.arguments[0].value];
        }
        if(fx.callee.name==='expr'){
            ret={
                $expr:js_parse(fx.arguments[0],params,true,forNot,"$")
            };
            return ret
        }
        if(fx.callee.name==="regex"){
            var left=js_parse(fx.arguments[0],params,true,forNot);
            var right=js_parse(fx.arguments[1],params,true,forNot);
            ret={}
            var p={};
           // ret=p;
            var items=left.split('.');
            for(var i=0;i<items.length-1;i++){
              p[items[i]]={};
              p=p[items[i]];
            }
           
            if(fx.arguments.length==2){
                if(forNot){
                    ret[left]={
                        $ne:{
                            $regex: new RegExp(right)
                        }
                    };        
                }
                else {
                    ret[left]={
                        $regex: new RegExp(right)
                    };        
                }
                
            }
            else if(fx.arguments.length==3) {
                ret[left]={
                    $regex: new RegExp(right,js_parse(fx.arguments[2],params,true,forNot))
                }; 
            }
            
            return ret;
        }
        if(fx.callee.name==="iif"){
            return {
                $cond: {
                   "if": js_parse(fx.arguments[0],params,true,forNot,"$"),
                   "then": js_parse(fx.arguments[1],params,true,forNot,"$"),
                   "else": js_parse(fx.arguments[2],params,true,forNot,"$")
                }
            }
        }
        if(fx.callee.name=="switch"){
           
            ret={
                $switch:{
                    branches:[],
                    default:js_parse(fx.arguments[fx.arguments.length-1],params,true,forNot,"$")
                }
            };
            for(var i=0;i<fx.arguments.length-1;i++){
                ret.$switch.branches.push(js_parse(fx.arguments[i],params,true,forNot,"$"));
            }
            return ret;
        }
        if(fx.callee.name=="case"){
            if(fx.arguments.length<2){
                throw(new Error("case must have 2 params"))
            }
            return {
                case:js_parse(fx.arguments[0],params,true,false,"$"),
                then:js_parse(fx.arguments[1],params,true,false,"$")
            }
        }
        if(fx.callee.name=="in" && (!forSelect)){
          	var ret={};
          	
          	var field=js_parse(fx.arguments[0],params,true,forNot,"$");
          	if(typeof field!="string"){
          	  throw(new Error("match or where with $in must be begin with field name, not object" ))
          	}
          	ret[field]={};
          	ret[field]["$in"]=js_parse(fx.arguments[1],params,true,forNot,"$");
          	
            return ret;
        }
        if(fx.callee.name==="dateToString"){
          	/*
          		{ 	$dateToString: {
				    date: <dateExpression>,
    				format: <formatString>,
    				timezone: <tzExpression>,
    				onNull: <expression>
				} }
          	*/
          	var paramIndexs=['date','format','timezone'];
          	var ret={
          	  	$dateToString:{}
          	};
          	for(var i=0;i<fx.arguments.length;i++){
          	   ret.$dateToString[paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,"$");
          	}
          	return ret;
        }
        if(fx.callee.name==="dateFromString"){
        	/*
        		{ $dateFromString: {
	   			  dateString: <dateStringExpression>,
				     format: <formatStringExpression>,
			     timezone: <tzExpression>,
			     onError: <onErrorExpression>,
			     onNull: <onNullExpression>
				} }
 	       */
 	       var paramIndexs=['dateString','format','timezone','onNull','onError'];
 	       var ret={
          	  	$dateFromString:{}
          	};
          	for(var i=0;i<fx.arguments.length;i++){
          	    var val=js_parse(fx.arguments[i],params,true,forNot,"$");
          	    if(val!=null){
          	        ret.$dateFromString[paramIndexs[i]]=val;     
          	    }
          	   
          	}
          	return ret;
        }
        if(fx.callee.name==="dateToParts"){
          	/*
          		{
				    $dateToParts: {
				        'date' : <dateExpression>,
				        'timezone' : <timezone>,
				        'iso8601' : <boolean>
				    }
				}
          	*/
          	var paramIndexs=['date','timezone','iso8601'];
          	var ret={
          	  	$dateToParts:{}
          	};
          	
          	for(var i=0;i<fx.arguments.length;i++){
          	    
          	    var val=js_parse(fx.arguments[i],params,true,forNot,"$");
          
          	    if(val!=null){
          	        ret.$dateToParts[paramIndexs[i]]=val;     
          	    }
          	   
          	}
          	return ret;
        }
        if(fx.callee.name=="hour"||
            fx.callee.name=="minute"||
            fx.callee.name=="dayOfMonth"||
            fx.callee.name=="dayOfYear"||
            fx.callee.name=="second"){
            var paramIndexs=["date", "timezone"]
            var ret={};
            ret["$"+fx.callee.name]={}
          	for(var i=0;i<fx.arguments.length;i++){
          	   ret["$"+fx.callee.name][paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,"$");
          	}
          	return ret;
        }
        if(fx.callee.name=="dateFromParts"){
            var paramIndexs=["year","month","day","hour","minute","second","millisecond","timezone"];
            var ret={$dateFromParts:{}};
            for(var i=0;i<fx.arguments.length;i++){
                var val=js_parse(fx.arguments[i],params,true,forNot,"$");
                if(val!=null){
                    ret.$dateFromParts[paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,"$"); 
                }
          	   
          	}
          	return ret;
        }
        if(fx.callee.name=="rtrim"||
            fx.callee.name=="ltrim"){
            var paramIndexs=["input", "chars"]
            var ret={};
            ret["$"+fx.callee.name]={}
          	for(var i=0;i<fx.arguments.length;i++){
          	   ret["$"+fx.callee.name][paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,"$");
          	}
          	return ret;    
        }
        if(fx.callee.name==="ceil"){
          return {
            	$ceil:js_parse(fx.arguments[0],params,true,forNot,"$")
          }
        }
        if(fx.callee.name==="arrayToObject"||
           fx.callee.name=="reverseArray"    ){
               var ret={};
               ret["$"+fx.callee.name]=js_parse(fx.arguments[0],params,true,forNot,"$");
               return ret;
        }
        if(fx.callee.name=="reduce"){
            /*
                    {
                       $reduce: {
                          input: [ [ 3, 4 ], [ 5, 6 ] ],
                          initialValue: [ 1, 2 ],
                          in: { $concatArrays : ["$$value", "$$this"] }
                       }
                    }
            */
            var paramIndexs=["input", "initialValue","in"]
            var ret={};
            ret["$"+fx.callee.name]={}
          	for(var i=0;i<fx.arguments.length;i++){
          	   ret["$"+fx.callee.name][paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,"$");
          	}
          	return ret;
        }
        if(fx.callee.name==="convert"){
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
          	var paramIndexs=['input','to','onNull','onError'];
          	var ret={
          	  	$convert:{}
          	};
          	for(var i=0;i<fx.arguments.length;i++){
          	    var val=js_parse(fx.arguments[i],params,true,forNot,"$");
          	    if(val!=null){
          	        ret.$convert[paramIndexs[i]]=val;     
          	    }
          	   
          	}
          	return ret;
        }
        if(fx.callee.name==="filter"){
           //{ $filter: { input: <array>, as: <string>, cond: <expression> } }
           var paramIndexs=['input','as','cond'];
           var prefix=["$",undefined,"$"];
           var ret= {
             	$filter:{}
           }
           for(var i=0;i<fx.arguments.length;i++){
          	   ret.$filter[paramIndexs[i]]=js_parse(fx.arguments[i],params,true,forNot,prefix[i]);
          	}
          	return ret;
        }
        if(fx.callee.name==="type"){
          if(fx.arguments.length==2){
           var field=js_parse(fx.arguments[0],params,true,forNot,"$");
           var val=js_parse(fx.arguments[1],params,true,forNot,"$");
           var ret={};
           
           if(forNot){
             	ret[field]={
             	  $not:{
             			$type: val
             		}
           		};
           		return ret;
           }
           ret[field]={
             	$type:val
           };
           return ret;
          }
          else {
            	return {
            	  	$type:js_parse(fx.arguments[0],params,true,forNot,"$")
            	}
          }
        }
        else if(fx.callee.name==="size"){
          	return {
            	  	$size:js_parse(fx.arguments[0],params,true,forNot,"$")
            	}
        }
        else if(fx.callee.name=='mergeObjects'){
            if(fx.arguments.length===1){
                return {
                    $mergeObjects:js_parse(fx.arguments[0],params,true,forNot,"$")
                }
            }
            else {
                var ret={
                    $mergeObjects:[]
                }
                for(var i=0;i<fx.arguments.length;i++){
                    ret.$mergeObjects.push(js_parse(fx.arguments[i],params,true,forNot,"$"))
                }
                return ret;
            }
        }
        else {
            ret={};
            var args=[];
            for(var i=0;i<fx.arguments.length;i++){
                args.push(js_parse(fx.arguments[i],params,true,forNot,"$"))
            }
            ret["$"+fx.callee.name]=args;
            return ret;
        }
    }
    }
}) 
db.system.js.save(
	{
		_id:"expr",
		value:function(x,p){
		   
		    var expr=x;

		    var params =p;
		   
			return js_parse(jsep(expr,params),params);
		}
	}
);

db.system.js.save({
    _id:"query",
    value:function(name){
        function qr(name){
            if(name){
                  if(typeof name==="string"){
                    this.name=name;
                  }
                  else if(name._shortName) {
                   
                     this.coll=name;
                  }
            }
            
            this.pipeline=[];
            
        }
        qr.prototype.parse=function(obj,params,forMatch,isSecond){
           if(obj== undefined) {
               return undefined
           }    
          if(!forMatch){
             forMatch=false;
          }
            if(typeof obj ==="string"){
                
              if(forMatch){
                    return js_parse(jsep(obj,params),params,!forMatch,false,"$");    
              }
              else {
                  return js_parse(jsep(obj,params),params,!forMatch,false,"$");    
              }
              
            }
            var txt=JSON.stringify(obj);
            
            if(txt[0]==="{" && txt[txt.length-1]==="}"){
                var ret={};
                var keys= Object.keys(obj);
                for(var i=0;i<keys.length;i++){
                    var key=keys[i];
                    var val= obj[key];
            
                    var r=this.parse(val,params,forMatch);
                    if(typeof r==="string"){
                      ret[key]=this.parse(val,params,forMatch,true,"$")
                    }
                    else {
                      ret[key]=this.parse(val,params,forMatch,true,"$")	
                    }
                    
                }
                return ret;
            }
            return obj
        }
        qr.prototype.stages=function(){
            for(var i=0;i<arguments.length;i++){
                this.pipeline.push(arguments[i]);
            }
            return this;
        }
       
        qr.prototype.project=function(){
            var selectors=arguments[0];
            
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		   
		    var data=this.parse(selectors,params);
		    
		    this.pipeline.push({
		        $project:data
		    })
            //js_parse(jsep(expr,params),params);
            return this;
        }  
        qr.prototype.addFields=function(){
            var selectors=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    var data=this.parse(selectors,params);
		    this.pipeline.push({
		        $addFields:data
		    })
            //js_parse(jsep(expr,params),params);
            return this;
        }  
        qr.prototype.items=function(options){
            var op={
                allowDiskUse:true
            }
            if(options){
                var keys=Object.keys(op);
                for(var i=0;i<keys.length;i++){
                    op[keys[i]]=options[keys[i]];
                }
            }
            if(this.coll){
               
              	return this.coll.aggregate(this.pipeline,op);
            }
            else {
            	return db.getCollection(this.name).aggregate(this.pipeline,op);
            }
        }
        qr.prototype.item=function(){
            var ret=this.limit(1).items().toArray();
            if(ret.length>0){
                return ret[0];
            }
            else {
                return null;
            }
        }
        qr.prototype.match=function(){
            var _expr=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    
		    this.pipeline.push({
		        $match: js_parse(jsep(_expr,params),params,false)
		    });
		    return this;
		 
        }
        qr.prototype.limit=function(num){
            this.pipeline.push({
                $limit:num
            });
            return this;
        }
        qr.prototype.skip=function(num){
            this.pipeline.push({
                $skip:num
            });
            return this;
        }
        qr.prototype.count=function(field){
            if(!field){
                field="ret"
            }
            this.pipeline.push({
                $count:field
            });
            return this;
        }
        qr.prototype.sort=function(){
            
            this.pipeline.push({
                $sort:arguments[0]
            });
            return this;
        }
        qr.prototype.orderBy=function(){
            var sort={};
            var params=arguments[0].split(",")
            for(var i=0;i<params.length;i++){
                if(params[i].indexOf(" ")>-1){
                    field=params[i].split(" ")[0];
                    sortType=params[i].split(" ")[1];
                    if(sortType.indexOf("asc")>-1){
                        sort[field]=1;
                    }
                    else if(sortType.indexOf("desc")>-1) {
                        sort[field]=-1;
                    }
                }
                else {
                    sort[params[i]]=1;
                }
            }
            this.pipeline.push({
                $sort:sort
            });
            return this;
        }
        qr.prototype.sortByCount=function(){
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
            this.pipeline.push({
                $sortByCount:this.parse(arguments[0],params,false,false)
            });
            return this;
        }
        qr.prototype.unwind=function(){
    
            if(arguments.length==1){
                this.pipeline.push({
                    $unwind:"$"+arguments[0]
                });
                return this;
            }
            else if(arguments.length==2){
                if(typeof arguments[1]==="string"){
                    this.pipeline.push({
                        $unwind:{
                            path:"$"+arguments[0],
                            includeArrayIndex:arguments[1]
                        }
                    });
                    return this;
                }
                
                if(typeof arguments[1]==="boolean"){
                    this.pipeline.push({
                        $unwind:{
                            path:"$"+arguments[0],
                            preserveNullAndEmptyArrays:arguments[1]
                        }
                    });
                    return this;
                }
            }
            else if(arguments.length==3){
                if(typeof arguments[1]==="string"){
                    this.pipeline.push({
                        $unwind:{
                            path:"$"+arguments[0],
                            includeArrayIndex:arguments[1],
                            preserveNullAndEmptyArrays:arguments[2]
                        }
                    });
                    return this;
                }
                if(typeof arguments[1]==="boolean"){
                    this.pipeline.push({
                        $unwind:{
                            path:"$"+arguments[0],
                            preserveNullAndEmptyArrays:arguments[1],
                            includeArrayIndex:arguments[2],
                        }
                    });
                    return this;
                }
            }
        }
        qr.prototype.replaceRoot=function(){
            var _obj= arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
            if(typeof _obj == "string"){
                this.pipeline.push({
                    $replaceRoot: { newRoot: this.parse(_obj,params) }
                });
                return this;
            }
            else{
                
                var data=this.parse(_obj,params);
    		    this.pipeline.push({
                    $replaceRoot: { newRoot: data }
                });
                return this;
            }
        }
        qr.prototype.bucket=function(){
            var data= arguments[0];
             var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    if(!data.groupBy){
		        throw(new Error("'groupBy' was not found"))
		    }
		    if(data.boundaries===undefined){
		        throw(new Error("'boundaries' was not found"))
		    }
		    if(!data.default){
		        throw(new Error("'default' was not found"))
		    }
		    if(!data.output){
		        throw(new Error("'output' was not found"))
		    }
            // if(!(data.boundaries.push)){
            //     throw(new Error("'boundaries' must be an array"))
            // }
            if(typeof data.groupBy!=="string"){
                throw(new Error("'groupBy' must be a string"))
            }
            var groupBy=js_parse(jsep(data.groupBy,params),params,false,false,"$");
            var output=this.parse(data.output,params);
            var _default=this.parse(data.default,params,false,false,"$");
            this.pipeline.push({
                $bucket:{
                    groupBy:groupBy,
                    boundaries:data.boundaries,
                    default:_default,
                    output:output
                    
                }
            })
            return this;
        }
        qr.prototype.bucketAuto=function(){
             var data= arguments[0];
             var params =[];
             if(!data.groupBy){
                 throw(new Error('bucketAuto need a "groupBy" fields'))
             }
             if(data.buckets===undefined){
                 throw(new Error('bucketAuto need a "buckets" fields with numeric data type'))
             }
             var groupBy=js_parse(jsep(data.groupBy,params),params,false,false,"$");
             if(!data.output){
                 this.pipeline.push({
                     $bucketAuto:{
                         groupBy:groupBy,
                         buckets:data.buckets
                     }
                 });
             }
             else {
                 this.pipeline.push({
                     $bucketAuto:{
                         groupBy:groupBy,
                         buckets:data.buckets,
                         output:this.parse(data.output,params,false,false,"$")
                     }
                 });
             }
             return this;
        }
        qr.prototype.facet=function(){
            var data=arguments[0];
            var keys=Object.keys(data);
            var _facet={}
            for(var i=0;i<keys.length;i++){
                var key=keys[i];
                var val = data[key];
                if(!val.pipeline) {
                    throw(new Error("'"+key+"' is not 'query'"))
                }
                _facet[key]=val.pipeline;
                
            }
            this.pipeline.push({
                $facet:_facet
            });
            return this;
        }
        qr.prototype.lookup=function(){
           var param1=arguments[0];
           if(param1._shortName) {
               var _from=param1._shortName;
               if(arguments.length===4){
                 localField=arguments[1];
                 foreignField=arguments[2];
                 as=arguments[3];
                 this.pipeline.push({
          	  		$lookup:{
          	  	  		from:_from,
          	  	  		localField:localField,
          	  	  		foreignField:foreignField,
          	  	  		as:as
          	  		}
          		});
          		return this;
               }
           }
           else if(typeof param1==="string"){
             	var _from=param1;
             	localField=arguments[1];
                 foreignField=arguments[2];
                 as=arguments[3];
                 this.pipeline.push({
          	  		$lookup:{
          	  	  		from:_from,
          	  	  		localField:localField,
          	  	  		foreignField:foreignField,
          	  	  		as:as
          	  		}
          		});
          		return this;
           }
           else if(param1.from &&
           		   param1.localField &&
           		   param1.foreignField &&
           		   param1.as	){
             	if(param1.from._shortName){
             	  	param1.from=param1.from._shortName;
             	  	this.pipeline.push({
	          	  			$lookup:param1
		          	});
		          	return this;
             	}
             	else {
             	  	param1.from=param1.from._shortName;
             	  	this.pipeline.push({
	          	  			$lookup:param1
		          	});
		          	return this;
             	}
           }
           else if(param1.from &&
           		  
           		   param1.pipeline &&
           		   param1.as	){
           		    var params =[];
				    for(var i=1;i<arguments.length;i++){
				        params.push(arguments[i])
				    }  
				    var x={}
				    x.from=param1.from;
				    if(param1.from._shortName){
				      x.from=param1.from._shortName;
				      
				    }
				    if(param1.let){
				        x.let=this.parse(param1.let,params);
				    }
				    x.pipeline=param1.pipeline.pipeline;
				    x.as= param1.as;
				    this.pipeline.push({
	          	  			$lookup:x
		          	});
		          	return this;
           }
           
        }
        
        qr.prototype.join=function(from,localField,foreignField,as){
          this.lookup(from,localField,foreignField,as);
          this.unwind(as);
          return this;
        }
        qr.prototype.leftJoin=function(from,localField,foreignField,as){
          this.lookup(from,localField,foreignField,as);
          this.unwind(as,true);
          return this;
        }
        qr.prototype.rightJoin=function(from,localField,foreignField,as){
          var ret=from;
          ret= new qr(from);
          ret.lookup(this.name,foreignField,localField,as);
          ret.unwind(as,true);
          return ret;
        }
        qr.prototype.group=function(){
            var selectors=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    var data=this.parse(selectors,params);
		    
		    this.pipeline.push({
		        $group:data
		    });
		    return this;
        }
        qr.prototype.out=function(name){
          	this.pipeline.push({
          	   $out:name
          	});
          	var op={
                allowDiskUse:true
            }
            
            if(this.coll){
               
              	 return this.coll.aggregate(this.pipeline,op);
            }
            else {
               
            	return db.getCollection(this.name).aggregate(this.pipeline,op);
            }
          
        }
        qr.prototype.redact=function(){
            var selectors=arguments[0];
            
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		   
		    var data=this.parse(selectors,params);
		    
		    this.pipeline.push({
		        $redact:data
		    })
            //js_parse(jsep(expr,params),params);
            return this;
        }
        qr.prototype.createView=function(name,options){
           
          	var ret=db.createView(name, this.name, this.pipeline, options);
          	return ret;
        }
        qr.prototype.info=function(){
           if(this.coll){
		      	return db.getCollectionInfos({name:this.coll._shortName})
		    }
		    else {
		      return db.getCollectionInfos({name:this.name});
		    }
	       
	       
	    }
        qr.prototype.find=function(){
          if(arguments.length==0){
          	  	if(this.coll){
		      	    return this.coll.find({});
		        }
		        else {
		            return db.getCollection(this.name).find({});
		        }
          	}
            var selectors=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    var _expr= js_parse(jsep(selectors,params),params);
		    if(this.coll){
		      	return this.coll.find({});
		    }
		    else {
		      return db.getCollection(this.name).find({});
		    }
        }
        qr.prototype.findOne=function(){
         
          	if(arguments.length==0){
          	  	if(this.coll){
		      	    return this.coll.findOne({});
		        }
    		    else {
    		    	return db.getCollection(this.name).findOne({});
    		    }
          	}
            var selectors=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    var _expr= js_parse(jsep(selectors,params),params);
		    if(this.coll){
		      	return this.coll.findOne({});
		    }
		    else {
		    	return db.getCollection(this.name).findOne({});
		    }
        }
        qr.prototype.toFile=function(filePath){
          	var txt=JSON.stringify(this.items()._batch);
          	var ret=writeFile(filePath,txt);
          	return ret;
        }
       	qr.prototype.insert=function(){
       	  	var ret=new entity(this,null);
       	  	var isArray=arguments[0].push!=undefined;
       	  	if(arguments.length==1){
       	  	   ret.insert(arguments[0]);
       	  	   return ret;
       	  	}
       	  	else {
       	  	  var data=[];
       	  	  for(var i=0;i<arguments.length;i++){
       	  	     data.push(arguments[i]);
       	  	  }
       	  	  ret.insert(data);
       	  	  return ret;
       	  	}
       	}
       	qr.prototype.push=function(data){
       	  	var ret= new entity(this);
       	  	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$push){
	      	  ret._updateData.$push={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  ret._updateData.$push[keys[i]]=data[keys[i]];
	      	}
	      	return ret;
       	}
       	entity.prototype.addToSet=function(data){
       	   var ret= new entity(this);
	      	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$addToSet){
	      	  ret._updateData.$addToSet={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  ret._updateData.$addToSet[keys[i]]=data[keys[i]];
	      	}
	      	return ret;
	    }
       	qr.prototype.pull=function(){
       	  	var selectors=arguments[0];
            var params =[];
            var ret =new entity(this);
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$pull){
	      	  ret._updateData.$pull={};
	      	}
		    if(typeof selectors == "string"){
	
		      	var _expr=js_parse(jsep(selectors,params),params);
		      	var keys=Object.keys(_expr);
	      		ret._updateData.$pull[keys[0]]=_expr[keys[0]];
		      	return ret;
		    }
		    else {
		    	var _expr= ret._owner.parse(selectors,params,true);
		    	var keys=Object.keys(_expr);
	      		for(var i=0;i<keys.length;i++){
	      	 	  ret._updateData.$pull[keys[i]]=_expr[keys[i]];
		      	}
		      	return ret;
		    }
       	}
       	entity.prototype.pullAll=function(){
	      	var selectors=arguments[0];
            var params =[];
             var ret =new entity(this);
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$pullAll){
	      	   ret._updateData.$pullAll={};
	      	}
	      	
		    if(typeof selectors == "string"){
	
		      	var _expr=js_parse(jsep(selectors,params),params);
		      	var keys=Object.keys(_expr);
	      		ret._updateData.$pullAll[keys[0]]=_expr[keys[0]];
		      	return ret;
		    }
		    else {
		    	var _expr= ret._owner.parse(selectors,params,true);
		    	var keys=Object.keys(_expr);
	      		for(var i=0;i<keys.length;i++){
	      	 	  ret._updateData.$pullAll[keys[i]]=_expr[keys[i]];
		      	}
		      	return ret;
		    }
	    }
	    qr.prototype.pop=function(data){
	      var ret =new entity(this);
	      	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$pop){
	      	  ret._updateData.$pop={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  ret._updateData.$pop[keys[i]]=data[keys[i]];
	      	}
	      	return ret;
	    }
       	qr.prototype.inc=function(data){
       	   var ret=new entity(this);
       	  	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$inc){
	      	  ret._updateData.$inct={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   ret._updateData.$inc[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return ret;
       	}
       	qr.prototype.rename=function(data){
       	   var ret=new entity(this);
       	  	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$rename){
	      	  ret._updateData.$rename={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   ret._updateData.$rename[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return ret;
       	}
       	qr.prototype.set=function(data){
       	   var ret=new entity(this);
       	  	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$set){
	      	  ret._updateData.$set={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   ret._updateData.$set[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return ret;
       	}
       	qr.prototype.unset=function(data){
       	   var ret=new entity(this);
       	  	if(!ret._updateData){
	      	  	ret._updateData={};
	      	}
	      	if(!ret._updateData.$unset){
	      	  ret._updateData.$unset={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   ret._updateData.$unset[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return ret;
       	}
        qr.prototype.where=function(){
          	var selectors=arguments[0];
            var params =[];
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i]);
		    }
		    var _expr= js_parse(jsep(selectors,params),params);
          	return new entity(this,_expr);		
        }
        //-----------------------------------------
        function entity(qr,_expr){
            this._owner=qr;
      		if(qr.name){
      		  this.coll=db.getCollection(qr.name);
      		}
      		else {
      		  this.coll=qr.coll;
      		}
      		
	      	
    	  	this._expr=_expr;
    	}
    	entity.prototype.items=function(){
    	  	if(this._expr){
    	  	  	return this.coll.find(this._expr);
    	  	}
    	  	else {
    	  	   return this.coll.find({});
    	  	}
    	}
    	entity.prototype.item=function(){
    	  	if(this._expr){
    	  	  	return this.coll.findOne(this._expr);
    	  	}
    	  	else {
    	  	   return this.coll.findOne({});
    	  	}
    	}
    	entity.prototype.out=function(collectionName){
    	  	if(this._expr){
    	  	  	var ret = this.coll.aggregate([
    	  	  		{
    	  	  		  $match:this._expr
    	  	  		},
    	  	  		{
    	  	  		  $out:collectionName
    	  	  		}
    	  	  	]);
    	  	  	return new query(collectionName);
    	  	}
    	  	else {
    	  	   var ret = this.coll.aggregate([
    	  	  		
    	  	  		{
    	  	  		  $out:collectionName
    	  	  		}
    	  	  	]);
    	  	  	return new query(collectionName);
    	  	}
    	}
    	entity.prototype.count=function(){
    	  
    	  	if(this._expr){
    	  	  	var ret = this.coll.aggregate([
    	  	  		{
    	  	  		  $match:this._expr
    	  	  		},
    	  	  		{
    	  	  		  $count:"retCount"
    	  	  		}
    	  	  	]).toArray();
    	  	  	if(ret.length==0){
    	  	  	   return 0;
    	  	  	}
    	  	  	else {
    	  	  	  return ret[0].retCount;
    	  	  	}
    	  	}
    	  	else {
    	  	   var ret = this.coll.aggregate([
    	  	  		
    	  	  		{
    	  	  		  $count:"ret"
    	  	  		}
    	  	  	]).toArray();
    	  	  	if(ret.length==0){
    	  	  	   return 0;
    	  	  	}
    	  	  	else {
    	  	  	  return ret[0].retCount;
    	  	  	}
    	  	}
    	}
    	entity.prototype.commit=function(){
    	  	if(this._insertItem!=null){
    	  	   return this.coll.insertOne(this._insertItem);
    	  	}
    	  	if(this._insertItems!=null){
    	  	   return this.coll.insertMany(this._insertItems);
    	  	}
    	  	if(this._updateData){
    	  	  if(this._expr){
    	  	  	return this.coll.updateMany(this._expr,this._updateData);
    	  	  }
    	  	  else {
    	  	    return this.coll.updateMany({},this._updateData);
    	  	  }
    	  	}
    	}
	    entity.prototype.insert=function(){
	      	this._insertItem=null;
	      	this._insertItems=null;
    	  	var isArray=arguments[0].push!=undefined;
    	  	if(isArray){
    	  	   	this._insertItems=arguments[0];
    	  	   	return this;
    	  	}
    	  	if(arguments.length==1){
    	  	  	this._insertItem=arguments[0];
    	  	}
    	  	else {
    	  	  	this._insertItems=[];
    	  	  	for(var i=0;i<arguments.length;i++){
    	  	  	 	this._insertItems.push(arguments[i]); 
    	  	  	}
				return this;
    	  	}
      		
	    }
	    entity.prototype.inc=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$inc){
	      	  this._updateData.$inc={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   this._updateData.$inc[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return this;
	    }
	    entity.prototype.rename=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$rename){
	      	  this._updateData.$rename={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   this._updateData.$rename[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return this;
	    }
	    entity.prototype.set=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$set){
	      	  this._updateData.$set={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   this._updateData.$set[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return this;
	    }
	    qr.prototype.unset=function(data){
       	   if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$unset){
	      	  this._updateData.$unset={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  if(keys[i]!="_id"){
	      	   this._updateData.$unset[keys[i]]=data[keys[i]];
	      	  }
	      	}
	      	return this;
       	}
	    entity.prototype.info=function(){
	       return db.getCollectionInfos({name:this.coll._shortName})
	       
	    }
	    entity.prototype.push=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$push){
	      	  this._updateData.$push={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  this._updateData.$push[keys[i]]=data[keys[i]];
	      	}
	      	return this;
	    }
	    entity.prototype.delete=function(){
	      if(!this._expr){
	        throw(new Error("Can not delete data without where"))
	      }
	      	return this.coll.deleteMany(this._expr);
	    }
	    entity.prototype.pullAll=function(){
	      	var selectors=arguments[0];
            var params =[];
            
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$pullAll){
	      	  this._updateData.$pullAll={};
	      	}
		    if(typeof selectors == "string"){
	
		      	var _expr=js_parse(jsep(selectors,params),params);
		      	var keys=Object.keys(_expr);
	      		this._updateData.$pullAll[keys[0]]=_expr[keys[0]];
		      	return this;
		    }
		    else {
		    	var _expr= this._owner.parse(selectors,params,true);
		    	var keys=Object.keys(_expr);
	      		for(var i=0;i<keys.length;i++){
	      	 	  this._updateData.$pullAll[keys[i]]=_expr[keys[i]];
		      	}
		      	return this;
		    }
	    }
	    entity.prototype.pull=function(){
	      	var selectors=arguments[0];
            var params =[];
            
		    for(var i=1;i<arguments.length;i++){
		        params.push(arguments[i])
		    }
		    if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$pull){
	      	  this._updateData.$pull={};
	      	}
		    if(typeof selectors == "string"){
	
		      	var _expr=js_parse(jsep(selectors,params),params);
		      	var keys=Object.keys(_expr);
	      		this._updateData.$pull[keys[0]]=_expr[keys[0]];
		      	return this;
		    }
		    else {
		    	var _expr= this._owner.parse(selectors,params,true);
		    	var keys=Object.keys(_expr);
	      		for(var i=0;i<keys.length;i++){
	      	 	  this._updateData.$pull[keys[i]]=_expr[keys[i]];
		      	}
		      	return this;
		    }
		    
		    
	      	
	    }
	    entity.prototype.addToSet=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$addToSet){
	      	  this._updateData.$addToSet={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  this._updateData.$addToSet[keys[i]]=data[keys[i]];
	      	}
	      	return this;
	    }
	    entity.prototype.pop=function(data){
	      	if(!this._updateData){
	      	  	this._updateData={};
	      	}
	      	if(!this._updateData.$pop){
	      	  this._updateData.$pop={};
	      	}
	      	var keys=Object.keys(data);
	      	for(var i=0;i<keys.length;i++){
	      	  this._updateData.$pop[keys[i]]=data[keys[i]];
	      	}
	      	return this;
	    }
        return new qr(name)
    }
    
   
})

db.loadServerScripts()