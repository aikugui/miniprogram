# miniprogram

[![GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Build Status](https://travis-ci.org/zhuweiyou/miniprogram.svg?branch=master)](https://travis-ci.org/zhuweiyou/miniprogram)

微信小程序轻量级脚手架

正在开发中

## 功能

- [x] 使用 less 编写 .wxss
- [x] 自动补全浏览器前缀样式
- [x] 将 px 转换为 rpx 单位
- [x] 使用 html 编写 .wxml
- [x] .env.\* 文件注入不同的环境配置
- [x] 压缩代码文件和图片资源
- [ ] 支持引入 npm 包
- [ ] 支持 es7 语法，如 await、async 等

## 命令

```bash
yarn dev
```

开发模式。会监视文件变化，自动处理文件

```bash
yarn build
```

生产模式。会压缩图片和代码，并使用 .env.production 配置

```bash
yarn page
```

快速生成页面需要的 4 个文件，并自动写入 app.json 配置

```bash
yarn component
```

快速生成组件需要的 4 个文件，并自动写入 app.json 配置
