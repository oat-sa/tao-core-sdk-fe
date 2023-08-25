module.exports = {
    root: true,
    extends: '@oat-sa/eslint-config-tao/amd',
    parserOptions: {
        requireConfigFile: false,
        // needed to support the dynamic import syntax
        ecmaVersion: 11
    }
};
