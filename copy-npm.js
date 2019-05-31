const through = require("through2");
const path = require("path");
const fs = require("fs");
const gulp = require("gulp");

const isFile = path => {
  try {
    return fs.statSync(path).isFile();
  } catch (e) {
    return false;
  }
};

const isDirectory = path => {
  try {
    return fs.statSync(path).isDirectory();
  } catch (e) {
    return false;
  }
};

const NODE_MODULES = "/node_modules/";

const completion = lib => {
  if (isFile(lib)) {
    return lib;
  }
  if (isFile(lib + ".js")) {
    return lib + ".js";
  }
  if (!isDirectory(lib)) {
    throw new Error("无法补全路径：" + lib);
  }
  if (isFile(lib + "/index.js")) {
    return lib + "/index.js";
  }
  if (!isFile(`${lib}/package.json`)) {
    throw new Error("无法补全路径：" + lib);
  }
  const { main } = JSON.parse(
    fs.readFileSync(`${lib}/package.json`).toString()
  );
  return completion(path.join(lib, main));
};

const fileMap = {};

const copyNpm = (source, basePath) => {
  let lib = "";
  if (/^[0-9a-z@]/i.test(source)) {
    lib = __dirname + NODE_MODULES + source;
  } else {
    lib = path.join(path.dirname(basePath), source);
  }
  const inNpm = lib.includes(NODE_MODULES);
  if (!inNpm) {
    return {};
  }
  lib = completion(lib);
  console.log("[copy npm]", lib);
  const [a, b] = lib.split(NODE_MODULES);

  gulp
    .src(lib, { base: a + NODE_MODULES })
    .pipe(
      through.obj(function(file, enc, cb) {
        if (fileMap[file.path]) {
          file.contents = Buffer.from(fileMap[file.path]);
        }
        this.push(file);
        cb();
      })
    )
    .pipe(gulp.dest("dist/npm"));

  // return { lib, replace: `/npm/${b}` };
  return {
    lib,
    replace: path
      .relative(
        basePath.replace("/src/", "/dist/").replace(NODE_MODULES, "/dist/npm/"),
        __dirname + "/dist/npm/" + b
      )
      .slice(1)
  };
};

const handleJs = (filePath, fileContents) => {
  return fileContents.replace(/require\(['"](.*?)['"]\)/g, (match, str) => {
    const { lib, replace } = copyNpm(str, filePath);
    if (!replace) {
      return match;
    }

    const nextFileContents = fs.readFileSync(lib).toString();
    if (nextFileContents.includes("require(")) {
      fileMap[lib] = handleJs(lib, nextFileContents);
    }

    return `require("${replace}")`;
  });
};

module.exports = () =>
  through.obj(function(file, enc, cb) {
    file.contents = Buffer.from(handleJs(file.path, file.contents.toString()));
    this.push(file);
    cb();
  });
