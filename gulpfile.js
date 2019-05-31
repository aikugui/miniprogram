const gulp = require("gulp");
const $ = require("gulp-load-plugins")();
const del = require("del");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const px2rpx = require("wx-px2rpx");
const prompts = require("prompts");
const fs = require("fs-extra");
const copyNpm = require("./copy-npm");
require("dotenv").config({ path: `${__dirname}/.env.${process.env.NODE_ENV}` });

const isProduction = process.env.NODE_ENV === "production";

const config = {
  clean: {
    src: ["dist/**/*"]
  },
  json: {
    src: ["src/**/*.json"],
    dest: "dist"
  },
  html: {
    src: "src/**/*.html",
    dest: "dist"
  },
  style: {
    src: "src/**/*.less",
    dest: "dist",
    postcss: [autoprefixer(), px2rpx()]
  },
  script: {
    src: "src/**/*.js",
    dest: "dist"
  },
  script2: {
    src: "dist/**/*.js",
    dest: "dist"
  },
  static: {
    src: "src/static/**/*",
    dest: "dist/static"
  },
  component: {
    src: "template/component/*.*",
    dest: "src/component"
  },
  page: {
    src: "template/page/*.*",
    dest: "src/page"
  }
};

if (isProduction) {
  config.style.postcss.push(cssnano());
}

function clean() {
  return del(config.clean.src);
}

function json() {
  return gulp
    .src(config.json.src)
    .pipe($.if(isProduction, $.jsonMinify()))
    .pipe(gulp.dest(config.json.dest));
}

function html() {
  return gulp
    .src(config.html.src)
    .pipe(
      $.if(
        isProduction,
        $.htmlmin({
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeEmptyAttributes: true
        })
      )
    )
    .pipe(
      $.rename({
        extname: ".wxml"
      })
    )
    .pipe(gulp.dest(config.html.dest));
}

function style() {
  return gulp
    .src(config.style.src)
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe($.less())
    .pipe($.postcss(config.style.postcss))
    .pipe(
      $.rename({
        extname: ".wxss"
      })
    )
    .pipe($.if(!isProduction, $.sourcemaps.write(".")))
    .pipe(gulp.dest(config.style.dest));
}

function script() {
  return gulp
    .src(config.script.src)
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe(
      $.babel({
        envName: process.env.NODE_ENV
      })
    )
    .pipe(copyNpm())
    .pipe($.if(isProduction, $.uglify()))
    .pipe($.if(!isProduction, $.sourcemaps.write(".")))
    .pipe(gulp.dest(config.script.dest));
}

function static() {
  return gulp
    .src(config.static.src)
    .pipe($.if(isProduction, $.imagemin()))
    .pipe(gulp.dest(config.static.dest));
}

function watch() {
  gulp.watch(config.json.src, json);
  gulp.watch(config.html.src, html);
  gulp.watch(config.style.src, style);
  gulp.watch(config.script.src, script);
}

async function page() {
  const { basename } = await prompts({
    type: "text",
    name: "basename",
    message: "请输入页面名称"
  });
  if (await fs.exists(`${__dirname}/src/page/${basename}`)) {
    throw new Error("页面已存在");
  }
  const appJsonPath = `${__dirname}/src/app.json`;
  const appJsonData = JSON.parse((await fs.readFile(appJsonPath)).toString());
  const pagePath = `page/${basename}/${basename}`;
  if (!Array.isArray(appJsonData.pages)) {
    appJsonData.pages = [];
  }
  if (!appJsonData.pages.includes(pagePath)) {
    appJsonData.pages.push(pagePath);
  }
  await fs.writeFile(appJsonPath, JSON.stringify(appJsonData, null, 2));
  return gulp
    .src(config.page.src)
    .pipe($.rename({ basename }))
    .pipe(gulp.dest(`${config.page.dest}/${basename}`));
}

async function component() {
  const { basename } = await prompts({
    type: "text",
    name: "basename",
    message: "请输入组件名称"
  });
  if (await fs.exists(`${__dirname}/src/component/${basename}`)) {
    throw new Error("组件已存在");
  }
  const appJsonPath = `${__dirname}/src/app.json`;
  const appJsonData = JSON.parse((await fs.readFile(appJsonPath)).toString());
  if (typeof appJsonData.usingComponents !== "object") {
    appJsonData.usingComponents = {};
  }
  appJsonData.usingComponents[basename] = `./component/${basename}/${basename}`;
  await fs.writeFile(appJsonPath, JSON.stringify(appJsonData, null, 2));
  return gulp
    .src(config.component.src)
    .pipe($.rename({ basename }))
    .pipe(gulp.dest(`${config.component.dest}/${basename}`));
}

exports.page = gulp.task(page);

exports.component = gulp.task(component);

exports.dev = gulp.series(
  clean,
  gulp.parallel(static, json, html, style, script),
  watch
);

exports.build = gulp.series(
  clean,
  gulp.parallel(static, json, html, style, script)
);
