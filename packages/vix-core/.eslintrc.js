const scaffold = require('@tekclaw/scaffold/.eslintrc');

module.exports = {
  ...scaffold,
  ignorePatterns: [...scaffold.ignorePatterns, 'analyze/'],
  parserOptions: {
    ...scaffold.parserOptions,
    project: './tsconfig.json',
  },
};
