// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/jsep/build/jsep.js":[function(require,module,exports) {
//     JavaScript Expression Parser (JSEP) 0.3.4
//     JSEP may be freely distributed under the MIT License
//     http://jsep.from.so/

/*global module: true, exports: true, console: true */
(function (root) {
  'use strict'; // Node Types
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
      PERIOD_CODE = 46,
      // '.'
  COMMA_CODE = 44,
      // ','
  SQUOTE_CODE = 39,
      // single quote
  DQUOTE_CODE = 34,
      // double quotes
  OPAREN_CODE = 40,
      // (
  CPAREN_CODE = 41,
      // )
  OBRACK_CODE = 91,
      // [
  CBRACK_CODE = 93,
      // ]
  QUMARK_CODE = 63,
      // ?
  SEMCOL_CODE = 59,
      // ;
  COLON_CODE = 58,
      // :
  throwError = function (message, index) {
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
  unary_ops = {
    '-': t,
    '!': t,
    '~': t,
    '+': t
  },
      // Also use a map for the binary operations but set their values to their
  // binary precedence for quick reference:
  // see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
  binary_ops = {
    '||': 1,
    '&&': 2,
    '|': 3,
    '^': 4,
    '&': 5,
    '==': 6,
    '!=': 6,
    '===': 6,
    '!==': 6,
    '<': 7,
    '>': 7,
    '<=': 7,
    '>=': 7,
    '<<': 8,
    '>>': 8,
    '>>>': 8,
    '+': 9,
    '-': 9,
    '*': 10,
    '/': 10,
    '%': 10
  },
      // Get return the longest key length of any object
  getMaxKeyLen = function (obj) {
    var max_len = 0,
        len;

    for (var key in obj) {
      if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
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
  binaryPrecedence = function (op_val) {
    return binary_ops[op_val] || 0;
  },
      // Utility function (gets called from multiple places)
  // Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
  createBinaryExpression = function (operator, left, right) {
    var type = operator === '||' || operator === '&&' ? LOGICAL_EXP : BINARY_EXP;
    return {
      type: type,
      operator: operator,
      left: left,
      right: right
    };
  },
      // `ch` is a character code in the next three functions
  isDecimalDigit = function (ch) {
    return ch >= 48 && ch <= 57; // 0...9
  },
      isIdentifierStart = function (ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
  },
      isIdentifierPart = function (ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 48 && ch <= 57 || // 0...9
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
  },
      // Parsing
  // -------
  // `expr` is a string with the passed in expression
  jsep = function (expr) {
    // `index` stores the character number we are currently at while `length` is a constant
    // All of the gobbles below will modify `index` as we move along
    var index = 0,
        charAtFunc = expr.charAt,
        charCodeAtFunc = expr.charCodeAt,
        exprI = function (i) {
      return charAtFunc.call(expr, i);
    },
        exprICode = function (i) {
      return charCodeAtFunc.call(expr, i);
    },
        length = expr.length,
        // Push `index` up to the next non-space character
    gobbleSpaces = function () {
      var ch = exprICode(index); // space or tab

      while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
        ch = exprICode(++index);
      }
    },
        // The main parsing function. Much of this code is dedicated to ternary expressions
    gobbleExpression = function () {
      var test = gobbleBinaryExpression(),
          consequent,
          alternate;
      gobbleSpaces();

      if (exprICode(index) === QUMARK_CODE) {
        // Ternary expression: test ? consequent : alternate
        index++;
        consequent = gobbleExpression();

        if (!consequent) {
          throwError('Expected expression', index);
        }

        gobbleSpaces();

        if (exprICode(index) === COLON_CODE) {
          index++;
          alternate = gobbleExpression();

          if (!alternate) {
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
    gobbleBinaryOp = function () {
      gobbleSpaces();
      var biop,
          to_check = expr.substr(index, max_binop_len),
          tc_len = to_check.length;

      while (tc_len > 0) {
        // Don't accept a binary op when it is an identifier.
        // Binary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (binary_ops.hasOwnProperty(to_check) && (!isIdentifierStart(exprICode(index)) || index + to_check.length < expr.length && !isIdentifierPart(exprICode(index + to_check.length)))) {
          index += tc_len;
          return to_check;
        }

        to_check = to_check.substr(0, --tc_len);
      }

      return false;
    },
        // This function is responsible for gobbling an individual expression,
    // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
    gobbleBinaryExpression = function () {
      var ch_i, node, biop, prec, stack, biop_info, left, right, i; // First, try to get the leftmost thing
      // Then, check to see if there's a binary operator operating on that leftmost thing

      left = gobbleToken();
      biop = gobbleBinaryOp(); // If there wasn't a binary operator, just return the leftmost node

      if (!biop) {
        return left;
      } // Otherwise, we need to start a stack to properly place the binary operations in their
      // precedence structure


      biop_info = {
        value: biop,
        prec: binaryPrecedence(biop)
      };
      right = gobbleToken();

      if (!right) {
        throwError("Expected expression after " + biop, index);
      }

      stack = [left, biop_info, right]; // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)

      while (biop = gobbleBinaryOp()) {
        prec = binaryPrecedence(biop);

        if (prec === 0) {
          break;
        }

        biop_info = {
          value: biop,
          prec: prec
        }; // Reduce: make a binary expression from the three topmost entries.

        while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
          right = stack.pop();
          biop = stack.pop().value;
          left = stack.pop();
          node = createBinaryExpression(biop, left, right);
          stack.push(node);
        }

        node = gobbleToken();

        if (!node) {
          throwError("Expected expression after " + biop, index);
        }

        stack.push(biop_info, node);
      }

      i = stack.length - 1;
      node = stack[i];

      while (i > 1) {
        node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
        i -= 2;
      }

      return node;
    },
        // An individual part of a binary expression:
    // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
    gobbleToken = function () {
      var ch, to_check, tc_len;
      gobbleSpaces();
      ch = exprICode(index);

      if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
        // Char code 46 is a dot `.` which can start off a numeric literal
        return gobbleNumericLiteral();
      } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
        // Single or double quotes
        return gobbleStringLiteral();
      } else if (ch === OBRACK_CODE) {
        return gobbleArray();
      } else {
        to_check = expr.substr(index, max_unop_len);
        tc_len = to_check.length;

        while (tc_len > 0) {
          // Don't accept an unary op when it is an identifier.
          // Unary ops that start with a identifier-valid character must be followed
          // by a non identifier-part valid character
          if (unary_ops.hasOwnProperty(to_check) && (!isIdentifierStart(exprICode(index)) || index + to_check.length < expr.length && !isIdentifierPart(exprICode(index + to_check.length)))) {
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

        if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
          // open parenthesis
          // `foo`, `bar.baz`
          return gobbleVariable();
        }
      }

      return false;
    },
        // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
    // keep track of everything in the numeric literal and then calling `parseFloat` on that string
    gobbleNumericLiteral = function () {
      var number = '',
          ch,
          chCode;

      while (isDecimalDigit(exprICode(index))) {
        number += exprI(index++);
      }

      if (exprICode(index) === PERIOD_CODE) {
        // can start with a decimal marker
        number += exprI(index++);

        while (isDecimalDigit(exprICode(index))) {
          number += exprI(index++);
        }
      }

      ch = exprI(index);

      if (ch === 'e' || ch === 'E') {
        // exponent marker
        number += exprI(index++);
        ch = exprI(index);

        if (ch === '+' || ch === '-') {
          // exponent sign
          number += exprI(index++);
        }

        while (isDecimalDigit(exprICode(index))) {
          //exponent itself
          number += exprI(index++);
        }

        if (!isDecimalDigit(exprICode(index - 1))) {
          throwError('Expected exponent (' + number + exprI(index) + ')', index);
        }
      }

      chCode = exprICode(index); // Check to make sure this isn't a variable name that start with a number (123abc)

      if (isIdentifierStart(chCode)) {
        throwError('Variable names cannot start with a number (' + number + exprI(index) + ')', index);
      } else if (chCode === PERIOD_CODE) {
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
    gobbleStringLiteral = function () {
      var str = '',
          quote = exprI(index++),
          closed = false,
          ch;

      while (index < length) {
        ch = exprI(index++);

        if (ch === quote) {
          closed = true;
          break;
        } else if (ch === '\\') {
          // Check for all of the common escape codes
          ch = exprI(index++);

          switch (ch) {
            case 'n':
              str += '\n';
              break;

            case 'r':
              str += '\r';
              break;

            case 't':
              str += '\t';
              break;

            case 'b':
              str += '\b';
              break;

            case 'f':
              str += '\f';
              break;

            case 'v':
              str += '\x0B';
              break;

            default:
              str += ch;
          }
        } else {
          str += ch;
        }
      }

      if (!closed) {
        throwError('Unclosed quote after "' + str + '"', index);
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
    gobbleIdentifier = function () {
      var ch = exprICode(index),
          start = index,
          identifier;

      if (isIdentifierStart(ch)) {
        index++;
      } else {
        throwError('Unexpected ' + exprI(index), index);
      }

      while (index < length) {
        ch = exprICode(index);

        if (isIdentifierPart(ch)) {
          index++;
        } else {
          break;
        }
      }

      identifier = expr.slice(start, index);

      if (literals.hasOwnProperty(identifier)) {
        return {
          type: LITERAL,
          value: literals[identifier],
          raw: identifier
        };
      } else if (identifier === this_str) {
        return {
          type: THIS_EXP
        };
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
    gobbleArguments = function (termination) {
      var ch_i,
          args = [],
          node,
          closed = false;

      while (index < length) {
        gobbleSpaces();
        ch_i = exprICode(index);

        if (ch_i === termination) {
          // done parsing
          closed = true;
          index++;
          break;
        } else if (ch_i === COMMA_CODE) {
          // between expressions
          index++;
        } else {
          node = gobbleExpression();

          if (!node || node.type === COMPOUND) {
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
    gobbleVariable = function () {
      var ch_i, node;
      ch_i = exprICode(index);

      if (ch_i === OPAREN_CODE) {
        node = gobbleGroup();
      } else {
        node = gobbleIdentifier();
      }

      gobbleSpaces();
      ch_i = exprICode(index);

      while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
        index++;

        if (ch_i === PERIOD_CODE) {
          gobbleSpaces();
          node = {
            type: MEMBER_EXP,
            computed: false,
            object: node,
            property: gobbleIdentifier()
          };
        } else if (ch_i === OBRACK_CODE) {
          node = {
            type: MEMBER_EXP,
            computed: true,
            object: node,
            property: gobbleExpression()
          };
          gobbleSpaces();
          ch_i = exprICode(index);

          if (ch_i !== CBRACK_CODE) {
            throwError('Unclosed [', index);
          }

          index++;
        } else if (ch_i === OPAREN_CODE) {
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
    gobbleGroup = function () {
      index++;
      var node = gobbleExpression();
      gobbleSpaces();

      if (exprICode(index) === CPAREN_CODE) {
        index++;
        return node;
      } else {
        throwError('Unclosed (', index);
      }
    },
        // Responsible for parsing Array literals `[1, 2, 3]`
    // This function assumes that it needs to gobble the opening bracket
    // and then tries to gobble the expressions as arguments.
    gobbleArray = function () {
      index++;
      return {
        type: ARRAY_EXP,
        elements: gobbleArguments(CBRACK_CODE)
      };
    },
        nodes = [],
        ch_i,
        node;

    while (index < length) {
      ch_i = exprICode(index); // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators

      if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
        index++; // ignore separators
      } else {
        // Try to gobble each expression individually
        if (node = gobbleExpression()) {
          nodes.push(node); // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        } else if (index < length) {
          throwError('Unexpected "' + exprI(index) + '"', index);
        }
      }
    } // If there's only one expression just try returning the expression


    if (nodes.length === 1) {
      return nodes[0];
    } else {
      return {
        type: COMPOUND,
        body: nodes
      };
    }
  }; // To be filled in by the template


  jsep.version = '0.3.4';

  jsep.toString = function () {
    return 'JavaScript Expression Parser (JSEP) v' + jsep.version;
  };
  /**
   * @method jsep.addUnaryOp
   * @param {string} op_name The name of the unary op to add
   * @return jsep
   */


  jsep.addUnaryOp = function (op_name) {
    max_unop_len = Math.max(op_name.length, max_unop_len);
    unary_ops[op_name] = t;
    return this;
  };
  /**
   * @method jsep.addBinaryOp
   * @param {string} op_name The name of the binary op to add
   * @param {number} precedence The precedence of the binary op (can be a float)
   * @return jsep
   */


  jsep.addBinaryOp = function (op_name, precedence) {
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


  jsep.addLiteral = function (literal_name, literal_value) {
    literals[literal_name] = literal_value;
    return this;
  };
  /**
   * @method jsep.removeUnaryOp
   * @param {string} op_name The name of the unary op to remove
   * @return jsep
   */


  jsep.removeUnaryOp = function (op_name) {
    delete unary_ops[op_name];

    if (op_name.length === max_unop_len) {
      max_unop_len = getMaxKeyLen(unary_ops);
    }

    return this;
  };
  /**
   * @method jsep.removeAllUnaryOps
   * @return jsep
   */


  jsep.removeAllUnaryOps = function () {
    unary_ops = {};
    max_unop_len = 0;
    return this;
  };
  /**
   * @method jsep.removeBinaryOp
   * @param {string} op_name The name of the binary op to remove
   * @return jsep
   */


  jsep.removeBinaryOp = function (op_name) {
    delete binary_ops[op_name];

    if (op_name.length === max_binop_len) {
      max_binop_len = getMaxKeyLen(binary_ops);
    }

    return this;
  };
  /**
   * @method jsep.removeAllBinaryOps
   * @return jsep
   */


  jsep.removeAllBinaryOps = function () {
    binary_ops = {};
    max_binop_len = 0;
    return this;
  };
  /**
   * @method jsep.removeLiteral
   * @param {string} literal_name The name of the literal to remove
   * @return jsep
   */


  jsep.removeLiteral = function (literal_name) {
    delete literals[literal_name];
    return this;
  };
  /**
   * @method jsep.removeAllLiterals
   * @return jsep
   */


  jsep.removeAllLiterals = function () {
    literals = {};
    return this;
  }; // In desktop environments, have a way to restore the old value for `jsep`


  if (typeof exports === 'undefined') {
    var old_jsep = root.jsep; // The star of the show! It's a function!

    root.jsep = jsep; // And a courteous function willing to move out of the way for other similarly-named objects!

    jsep.noConflict = function () {
      if (root.jsep === jsep) {
        root.jsep = old_jsep;
      }

      return jsep;
    };
  } else {
    // In Node.JS environments
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = jsep;
    } else {
      exports.parse = jsep;
    }
  }
})(this);
},{}],"node_modules/expression-eval/index.js":[function(require,module,exports) {
const jsep = require('jsep');

/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 */

const binops = {
  '||':  function (a, b) { return a || b; },
  '&&':  function (a, b) { return a && b; },
  '|':   function (a, b) { return a | b; },
  '^':   function (a, b) { return a ^ b; },
  '&':   function (a, b) { return a & b; },
  '==':  function (a, b) { return a == b; }, // jshint ignore:line
  '!=':  function (a, b) { return a != b; }, // jshint ignore:line
  '===': function (a, b) { return a === b; },
  '!==': function (a, b) { return a !== b; },
  '<':   function (a, b) { return a < b; },
  '>':   function (a, b) { return a > b; },
  '<=':  function (a, b) { return a <= b; },
  '>=':  function (a, b) { return a >= b; },
  '<<':  function (a, b) { return a << b; },
  '>>':  function (a, b) { return a >> b; },
  '>>>': function (a, b) { return a >>> b; },
  '+':   function (a, b) { return a + b; },
  '-':   function (a, b) { return a - b; },
  '*':   function (a, b) { return a * b; },
  '/':   function (a, b) { return a / b; },
  '%':   function (a, b) { return a % b; }
};

const unops = {
  '-' :  function (a) { return -a; },
  '+' :  function (a) { return a; },
  '~' :  function (a) { return ~a; },
  '!' :  function (a) { return !a; },
};

function evaluateArray ( list, context ) {
  return list.map(function (v) { return evaluate(v, context); });
}

async function evaluateArrayAsync( list, context ) {
  const res = await Promise.all(list.map((v) => evaluateAsync(v, context)));
  return res;
}

function evaluateMember ( node, context ) {
  const object = evaluate(node.object, context);
  if ( node.computed ) {
    return [object, object[evaluate(node.property, context)]];
  } else {
    return [object, object[node.property.name]];
  }
}

async function evaluateMemberAsync( node, context ) {
  const object = await evaluateAsync(node.object, context);
  if (  node.computed) {
    return [object, object[await evaluateAsync(node.property, context)]];
  } else {
    return [object, object[node.property.name]];
  }
}

function evaluate ( node, context ) {

  switch ( node.type ) {

    case 'ArrayExpression':
      return evaluateArray( node.elements, context );

    case 'BinaryExpression':
      return binops[ node.operator ]( evaluate( node.left, context ), evaluate( node.right, context ) );

    case 'CallExpression':
      let caller, fn, assign;
      if (node.callee.type === 'MemberExpression') {
        assign = evaluateMember( node.callee, context );
        caller = assign[0];
        fn = assign[1];
      } else {
        fn = evaluate( node.callee, context );
      }
      if (typeof fn  !== 'function') { return undefined; }
      return fn.apply( caller, evaluateArray( node.arguments, context ) );

    case 'ConditionalExpression':
      return evaluate( node.test, context )
        ? evaluate( node.consequent, context )
        : evaluate( node.alternate, context );

    case 'Identifier':
      return context[node.name];

    case 'Literal':
      return node.value;

    case 'LogicalExpression':
      if (node.operator === '||') {
        return evaluate( node.left, context ) || evaluate( node.right, context );
      } else if (node.operator === '&&') {
        return evaluate( node.left, context ) && evaluate( node.right, context );
      }
      return binops[ node.operator ]( evaluate( node.left, context ), evaluate( node.right, context ) );

    case 'MemberExpression':
      return evaluateMember(node, context)[1];

    case 'ThisExpression':
      return context;

    case 'UnaryExpression':
      return unops[ node.operator ]( evaluate( node.argument, context ) );

    default:
      return undefined;
  }

}

async function evaluateAsync( node, context ) {

  switch ( node.type ) {

    case 'ArrayExpression':
      return await evaluateArrayAsync( node.elements, context );

    case 'BinaryExpression': {
      const [left, right] = await Promise.all([
        evaluateAsync( node.left, context ),
        evaluateAsync( node.right, context )
      ]);
      return binops[ node.operator ]( left, right );
    }

    case 'CallExpression':
      let caller, fn, assign;
      if (node.callee.type === 'MemberExpression') {
        assign = await evaluateMemberAsync( node.callee, context );
        caller = assign[0];
        fn = assign[1];
      } else {
        fn = await evaluateAsync( node.callee, context );
      }
      if (typeof fn !== 'function') {
        return undefined;
      }
      return await fn.apply(
        caller,
        await evaluateArrayAsync( node.arguments, context ),
      );

    case 'ConditionalExpression':
      return (await evaluateAsync( node.test, context ))
        ? await evaluateAsync( node.consequent, context )
        : await evaluateAsync( node.alternate, context );

    case 'Identifier':
      return context[node.name];

    case 'Literal':
      return node.value;

    case 'LogicalExpression': {
      if (node.operator === '||') {
        return (
          (await evaluateAsync( node.left, context )) ||
          (await evaluateAsync( node.right, context ))
        );
      } else if (node.operator === '&&') {
        return (
          (await evaluateAsync( node.left, context )) &&
          (await evaluateAsync( node.right, context ))
        );
      }

      const [left, right] = await Promise.all([
        evaluateAsync( node.left, context ),
        evaluateAsync( node.right, context )
      ]);

      return binops[ node.operator ]( left, right );
    }

    case 'MemberExpression':
      return (await evaluateMemberAsync(node, context))[1];

    case 'ThisExpression':
      return context;

    case 'UnaryExpression':
      return unops[ node.operator ](await evaluateAsync( node.argument, context ));

    default:
      return undefined;
  }
}

function compile (expression) {
  return evaluate.bind(null, jsep(expression));
}

function compileAsync(expression) {
  return evaluateAsync.bind(null, jsep(expression));
}

module.exports = {
  parse: jsep,
  eval: evaluate,
  evalAsync: evaluateAsync,
  compile: compile,
  compileAsync: compileAsync
};

},{"jsep":"node_modules/jsep/build/jsep.js"}],"index.js":[function(require,module,exports) {
"use strict";

var expr = _interopRequireWildcard(require("expression-eval"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

console.log(expr.eval(expr.parse('sqrt(3)')));
},{"expression-eval":"node_modules/expression-eval/index.js"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "49404" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/index.js.map