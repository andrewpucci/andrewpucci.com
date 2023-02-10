module.exports = {
  extends: [
    'airbnb-base',
    'plugin:security/recommended',
  ],
  env: {
    browser: true,
    jquery: true,
    node: true,
    mocha: true,
  },
  plugins: [
    'mocha',
    'security',
  ],
  rules: {
    'mocha/no-exclusive-tests': 'error',
  },
};
