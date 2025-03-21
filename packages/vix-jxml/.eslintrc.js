const scaffold = require('@tekclaw/scaffold/.eslintrc');

module.exports = {
  ...scaffold,
  parserOptions: {
    ...scaffold.parserOptions,
    project: './tsconfig.json',
  },
};
