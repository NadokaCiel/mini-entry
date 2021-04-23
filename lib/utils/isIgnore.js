module.exports = function isIgnore(pathUrl, ignoreConfig) {
  if (!Array.isArray(ignoreConfig)) {
    return false;
  }

  return ignoreConfig.some((config) => {
    return new RegExp(`${config}`).test(pathUrl);
  });
};
