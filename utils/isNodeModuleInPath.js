function isNodeModuleInPath(pathUrl) {
  if (String(pathUrl).includes("node_modules")) {
    return true;
  }

  return false;
}

module.exports = isNodeModuleInPath;
