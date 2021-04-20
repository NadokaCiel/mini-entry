/*
 * @Author: youzhao.zhou
 * @Date: 2021-04-19 15:21:42
 * @Last Modified by: youzhao.zhou
 * @Last Modified time: 2021-04-20 16:26:26
 * @Description 获取webpack入口
 *
 * 1. 先解析app.json，获取主包和子包的页面路径
 * 2. 根据页面对应的json文件夹解析组件
 * 3. 自动导入子包
 * 4. 搜索node_modules组件
 */

const fs = require("fs");
const {
  join,
  relative,
  sep,
  normalize,
  parse,
  dirname,
  isAbsolute,
} = require("path");
const globby = require("globby");
const jsonfile = require("jsonfile");

const entryConfigPath = new Set();
const hasParsedEntryConfigPath = new Set();

let config = {};

// const demoConfig = {
//   entry: {
//     app: "src/app.json",
//     outside: "src/outside/**/*/app.json",
//   },
//   entrySuffix: {
//     js: "ts",
//     miniJs: "wxs",
//     xml: "wxml",
//   },
//   compiledSuffix: {
//     js: "js",
//     css: "wxss",
//     miniJs: "wxs",
//     xml: "wxml",
//   },
// };

/**
 * 解析获取入口路径
 * @param {Object} options 格式参考demoConfig
 */
async function getEntry(options) {
  entryConfigPath.clear();
  hasParsedEntryConfigPath.clear();

  config = options;

  const paths = await globby(Object.values(config.entry));

  if (paths.length === 0) {
    throw new Error("Not Found Entry File");
  }

  const entry = await getAllEntry(paths);
  console.log(entry);

  return entry;
}

/**
 * 解析所有入口的json文件
 * @param {Array} configFiles
 * @returns
 */
async function getAllEntry(configFiles) {
  const tmpConfigFiles = configFiles.splice(0);

  if (tmpConfigFiles.length === 0) {
    return {};
  }

  const appEntryFilePath = tmpConfigFiles.shift();

  const appEntry = await parseApp(appEntryFilePath);
  const componentEntry = parsePageAndComponent(entryConfigPath);

  const entry = {
    ...getAppEntry(appEntryFilePath),
    ...appEntry,
    ...componentEntry,
  };

  const result = await getAllEntry(tmpConfigFiles);

  return {
    ...entry,
    ...result,
  };
}

function getAppEntry(configFile) {
  const absolutePath = join(process.cwd(), configFile);

  const entryName = parse(absolutePath).name;

  return {
    [`${entryName}`]: absolutePath,
  };
}

async function parseApp(configFile) {
  const configData = await jsonfile.readFile(configFile);
  const mainPages = parsePages(configData.pages);
  const subPages = parseSubPages(configData.subpackages);

  const entryFileAbsolutePath = join(process.cwd(), configFile);

  const components = parseComponents(
    entryFileAbsolutePath,
    configData.usingComponents || {},
  );

  const pages = {
    ...mainPages,
    ...subPages,
    ...components,
  };

  return pages;
}

function parsePageAndComponent(configPath) {
  if (!(configPath instanceof Set)) {
    return {};
  }
  let componentEntry = {};

  configPath.forEach((configPathUrl) => {
    if (hasParsedEntryConfigPath.has(configPathUrl)) {
      return;
    }

    const configData = jsonfile.readFileSync(configPathUrl);
    hasParsedEntryConfigPath.add(configPathUrl);
    if (!configData.usingComponents) {
      return;
    }

    const components = parseComponents(
      configPathUrl,
      configData.usingComponents,
    );

    componentEntry = {
      ...componentEntry,
      ...components,
    };
  });

  return componentEntry;
}

/**
 * 获取页面路径，页面必须包含html、js文件
 * @param {Array}} pages
 * @returns {Object}
 * @example
 * const result = parsePages(["pages/index/index"]);
 * result ==> {
 *   "pages/index/index": [
 *     "src/pages/index/index.ts",
 *     "src/pages/index/index.json",
 *     "src/pages/index/index.wxml",
 *   ],
 * }
 */
function parsePages(pages) {
  if (!Array.isArray(pages)) {
    return {};
  }

  const entry = {};
  pages.forEach((page) => {
    let scriptPath = getAbsolutePath(`${page}.${config.entrySuffix.js}`);
    entry[page] = [getAbsolutePath(`${page}.${config.entrySuffix.xml}`)];

    const pageJsonPath = getAbsolutePath(`${page}.json`);
    if (fs.existsSync(pageJsonPath)) {
      entryConfigPath.add(pageJsonPath);
      entry[page].push(pageJsonPath);
    }

    if (!fs.existsSync(scriptPath)) {
      scriptPath = getAbsolutePath(`${page}.js`);
    }

    entry[page].push(scriptPath);
  });

  return entry;
}

/**
 * 获取子包页面路径
 * @param {Array} pages
 * @returns
 */
function parseSubPages(pages) {
  const subPages = pages
    .map((page) => {
      return page.pages.map((subPage) => {
        return join(page.root || "", subPage);
      });
    })
    .reduce((totalPages, curPages) => {
      return [...totalPages, ...curPages];
    }, []);
  return parsePages(subPages);
}

/**
 * 获取所有引用组件的路径
 * @param {string} componentsUserPath 组件使用者的绝对路径
 * @param {Object} components
 *
 * 1. 将所有的component路径转换成相对src的路径
 * 2. 过滤重复路径
 */
function parseComponents(componentsUserPath, components) {
  if (!componentsUserPath) {
    return [];
  }
  const filterSet = new Set();
  const componentPathList = Object.values(components)
    .map((pathUrl) => {
      return normalize(pathUrl);
    })
    .map((pathUrl) => {
      if (pathUrl.startsWith(sep)) {
        return pathUrl.replace(/^\//, "");
      }

      return relative(
        getAbsolutePath(""),
        getAbsolutePathWithBasePath(componentsUserPath, pathUrl),
      );
    })
    .filter((pathUrl) => {
      if (filterSet.has(pathUrl)) {
        return false;
      }
      filterSet.add(pathUrl);
      return true;
    })
    .map((pathUrl) => {
      const configPath = getAbsolutePath(`${pathUrl}.json`);
      if (fs.existsSync(configPath)) {
        entryConfigPath.add(configPath);
      }
      return pathUrl;
    });

  return parsePages(componentPathList);
}

/**
 * 获取项目源码目录
 */
function getSourceDir() {
  const entry = config.entry[Object.keys(config.entry)[0]];
  const normalizePath = normalize(relative(process.cwd(), entry));
  const pathUrlItem = normalizePath.split(sep);
  return pathUrlItem[0] || "";
}

/**
 * 绝对路径
 */
function getAbsolutePath(pathUrl) {
  return join(process.cwd(), getSourceDir(), pathUrl);
}

/**
 * 绝对路径
 */
function getAbsolutePathWithBasePath(basePath, pathUrl) {
  if (String(pathUrl).startsWith(sep)) {
    return getAbsolutePath(pathUrl.replace(/^\//, ""));
  }

  const base = isAbsolute(basePath) ? basePath : getAbsolutePath(basePath);

  if (fs.statSync(base).isFile) {
    return join(dirname(base), pathUrl);
  }
  return join(base, pathUrl);
}

module.exports = getEntry;
