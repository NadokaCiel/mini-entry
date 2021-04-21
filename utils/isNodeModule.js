/*
 * @Author: youzhao.zhou
 * @Date: 2021-04-20 18:05:45
 * @Last Modified by: youzhao.zhou
 * @Last Modified time: 2021-04-20 22:51:48
 * @Description 判断路径是不是node_modules中的库
 *
 * 1. 路径以/、./、../开头的都不是node_modules包
 */

function isNodeModule(pathUrl) {
  if (String(pathUrl).includes("node_modules")) {
    return true;
  }

  const reg = /^\.*\//;

  return !reg.test(pathUrl);
}

module.exports = isNodeModule;
