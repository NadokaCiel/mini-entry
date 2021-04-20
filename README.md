# mini-entry

解析小程序 json 文件

## Usage

```javascript
import getEntry from "mini-entry";

const entry = getEntry({
  entry: {
    app: "src/app.json",
    outside: "src/outside/**/*/app.json",
  },
  entrySuffix: {
    js: "ts",
    miniJs: "wxs",
    xml: "wxml",
  },
  compiledSuffix: {
    js: "js",
    css: "wxss",
    miniJs: "wxs",
    xml: "wxml",
  },
});

console.log(entry);
```
