interface IMiniEntryOptions {
  /**
   * 入口文件路径
   * @example
   * {
   *  app: "src/app.json",
   * }
   */
  // {outside: "src/outside/**/*/app.json",}
  entry: Record<string, string>;
  /**
   * 入口文件的扩展名
   */
  entrySuffix: {
    js: "js" | "ts";
    miniJs?: "wxs" | "sjs";
    xml: "wxml" | "axml" | "html";
    css?: string;
    
    [key: string]: any;
  };
  /**
   * 编译后的文件扩展名
   */
  compiledSuffix: {
    js: string;
    css: string;
    miniJs?: string;
    xml: string;
    [key: string]: any;
  };
  /**
   * 忽略文件
   */
  ignoreEntry?: string[];
}

interface IMiniEntryReturn {
  /**
   * 所有入口
   */
  entry: {
    [entryName: string]: string[];
  };
  /**
   * 所有json文件路径
   */
  jsonFiles: {
    [entryName: string]: string[];
  };
  /**
   * 子包所在文件夹
   */
  subPackagesDir: string[];
}

declare function getEntry(options: IMiniEntryOptions): IMiniEntryReturn;

declare module "mini-entry" {
  export default getEntry;
}
