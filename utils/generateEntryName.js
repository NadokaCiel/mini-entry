const isNodeModule = require("./isNodeModule");

function generateEntryName(pathUrl) {
  if (isNodeModule(pathUrl)) {
    return pathUrl.replace(/^node_modules\//, "");
  }
  return pathUrl;
}

module.exports = generateEntryName;
