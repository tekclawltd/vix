const scaffold = require('@tekclaw/scaffold/.eslintrc');

module.exports = {
  ...scaffold,
  ignorePatterns: [...scaffold.ignorePatterns, 'main/'],
  parserOptions: {
    ...scaffold.parserOptions,
    project: './tsconfig.json',
  },
};
