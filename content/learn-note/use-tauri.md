---
title: Tauri 的基本使用
date: 2026-01-04
tags:
  - tauri
  - startup
---

使用 Tauri 创建 GUI 应用. 主要技术是 Vue + JavaScript + Rust.

操作很简单, 创建出的应用很轻便, 使用系统自带的 WebView 就能运行. 开发 GUI 软件比较方便的同时, 还可以学学前端知识, 以及 Rust 语言.

可以去看[官方文档](https://v2.tauri.app/zh-cn/start/), 更加详细.

## 安装

电脑上至少要安装 [cargo](https://doc.rust-lang.org/cargo/index.html) + [rust](https://rust-lang.org/zh-CN/tools/install/), [nodejs + npm](https://nodejs.org).

其它略. 等稍微用熟练了再补充.

## 创建应用

### 快速命令行指引

```sh
npm create tauri-app@latest
✔ Project name · project-name
✔ Identifier · com.ker0123.project-name
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, deno, bun)
✔ Choose your package manager · npm
✔ Choose your UI template · Vue - (https://vuejs.org/)
✔ Choose your UI flavor · TypeScript

cd project-name

npm install

npm run tauri dev

```

### 详解

使用[在线脚本](https://create.tauri.app/ps)创建项目(文件夹)

```sh
irm https://create.tauri.app/ps | iex
```

或者使用 npm 包管理器, 安装 create-tauri-app, 然后利用其创建项目(文件夹)

```sh
npm create tauri-app@latest
```

在命令行内交互式输入项目名称, 前后端框架等信息, 最终会创建一个以项目名称命名的文件夹, 里面就是项目文件.

**注意!** 请不要在符号链接的路径下调试项目, 会因为路径解析原因导致编译失败.

我使用 Vue + TypeScript + Rust. 项目结构大致如下所示:

```sh
.
├───.vscode
├───public
├───src # 前端代码
│   └───assets
└───src-tauri # 后端代码
    ├───capabilities
    ├───icons
    └───src
```

需要进入项目文件夹, 使用 npm 安装项目依赖.

```sh
cd xxx-xxx-xxx # xxx-xxx... 为项目名
npm install
```

所有依赖安装完毕后, 使用 `npm` 或 `cargo` 间接调用 `tauri-cli` 来构建和运行应用.

```sh
npm run tauri dev
# or
cargo tauri dev
```

至此, 一个只有名称是自定义的项目创建成功.

## 前端开发

## 后端开发
