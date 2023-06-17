import { Type } from 'js-yaml';
import parser from 'esprima';

function resolveJavascriptFunction(data: any) {
  if (data === null) return false;

  try {
    return true;
  } catch (err) {
    return false;
  }
}

function constructJavascriptFunction(data: any) {
  var source = '(' + data + ')',
    ast = parser.parseScript(source, { range: true, jsx: true }),
    params: any = [],
    body;

  if (
    ast.type !== 'Program' ||
    ast.body.length !== 1 ||
    ast.body[0].type !== 'ExpressionStatement' ||
    (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
      ast.body[0].expression.type !== 'MemberExpression' &&
      ast.body[0].expression.type !== 'FunctionExpression' &&
      ast.body[0].expression.type !== 'TemplateLiteral' &&
      ast.body[0].expression.type !== 'Literal' &&
      ast.body[0].expression.type !== 'CallExpression')
  ) {
    throw new Error('Failed to resolve function');
  }

  if (
    [
      ast.body[0].expression.type === 'TemplateLiteral',
      ast.body[0].expression.type === 'Literal',
    ].some(Boolean)
  ) {
    return new Function(params, 'return ' + source);
  }

  if (
    [
      ast.body[0].expression.type === 'CallExpression',
      ast.body[0].expression.type === 'MemberExpression',
    ].some(Boolean)
  ) {
    return new Function(params, 'return ' + source);
  }

  ast.body[0].expression.params.forEach(function (param: any) {
    params.push(param.name);
  });

  body = ast.body[0].expression.body.range;

  // Parser's ranges include the first '{' and the last '}' characters on
  // function expressions. So cut them out.
  if (ast.body[0].expression.body.type === 'BlockStatement') {
    /*eslint-disable no-new-func*/
    return new Function(params, source.slice(body[0] + 1, body[1] - 1));
  }
  // ES6 arrow functions can omit the BlockStatement. In that case, just return
  // the body.
  /*eslint-disable no-new-func*/
  return new Function(params, 'return ' + source.slice(body[0], body[1]));
}

function representJavascriptFunction(object: any /*, style*/) {
  return object.toString();
}

function isFunction(object: any) {
  return Object.prototype.toString.call(object) === '[object Function]';
}

export default [
  new Type('tag:yaml.org,2002:js', {
    kind: 'scalar',
    resolve: resolveJavascriptFunction,
    construct: constructJavascriptFunction,
    predicate: isFunction,
    represent: representJavascriptFunction,
  }),
];
