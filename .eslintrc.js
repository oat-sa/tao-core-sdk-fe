module.exports = {
    root: true,
    extends: '@oat-sa/eslint-config-tao/amd',
    parserOptions: {
        // needed to support the dynamic import syntax
        ecmaVersion: 11
    }
};
