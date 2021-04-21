/*
 * @Author: youzhao.zhou
 * @Date: 2021-04-20 22:05:01
 * @Last Modified by: youzhao.zhou
 * @Last Modified time: 2021-04-21 17:02:51
 * @Description 生成node_modules中的组件入口
 * js wxml json wxss?
 * js wxml json文件是必须的，wxss不是必须的
 */

const fs = require("fs");
const { dirname, normalize, join, sep } = require("path");
const globby = require("globby");
const jsonfile = require("jsonfile");

const moduleDirName = "node_modules";

function generateNodeModuleEntry(pagePath, compiledSuffix) {
  const pathUrl = normalize(pagePath).replace(/^node_modules\//, "");
  const pathItems = pathUrl.split(sep);
  const moduleName = pathItems[0];
  const packageJsonPaths = globby.sync([moduleName], {
    cwd: join(process.cwd(), moduleDirName),
    expandDirectories: {
      files: ["package.json"],
    },
  });

  const modulesPath = packageJsonPaths
    .filter((item) => {
      return !item.includes(moduleDirName);
    })
    .filter((item) => {
      const dir = dirname(item);
      return pathUrl.includes(dir);
    });

  // 模块根目录
  const moduleDir = dirname(modulesPath[0]);

  const pkg = jsonfile.readFileSync(
    join(process.cwd(), moduleDirName, modulesPath[0]),
  );

  // 模块入口文件夹
  const pkgImportDir = pkg.miniprogram || pkg.files[0];

  const entryPath = join(
    moduleDir,
    pkgImportDir,
    // 如果路径中已经含有pkgImportDir，就删除pkgImportDir，避免重复
    pathUrl
      .replace(new RegExp(`^${moduleDir}`), "")
      .replace(new RegExp(`^\/${pkgImportDir}`), ""),
  );

  const entry = [
    `${moduleDirName}/${entryPath}.${compiledSuffix.js}`,
    `${moduleDirName}/${entryPath}.${compiledSuffix.xml}`,
    `${moduleDirName}/${entryPath}.json`,
  ];

  const stylePath = `${moduleDirName}/${entryPath}.${compiledSuffix.css}`;

  if (fs.existsSync(join(process.cwd(), stylePath))) {
    entry.push(stylePath);
  }

  return {
    entry,
    entryName: join(
      moduleDir,
      pathUrl
        .replace(new RegExp(`^${moduleDir}`), "")
        .replace(new RegExp(`^\/${pkgImportDir}`), ""),
    ),
    json: join(process.cwd(), `${moduleDirName}/${entryPath}.json`),
  };
}

module.exports = generateNodeModuleEntry;
