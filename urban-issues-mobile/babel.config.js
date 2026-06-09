module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // maps @/ imports to ./src/ so we don't need long relative paths
      ['module-resolver', { root: ['.'], alias: { '@': './src' }, extensions: ['.ts', '.tsx', '.js', '.jsx'] }],
    ],
  };
};
