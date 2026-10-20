const existingChecks = require('./tests/community/eslint.cjs');

module.exports = {
  ...existingChecks,
  extends: [...existingChecks.extends, 'next/core-web-vitals'],
};
