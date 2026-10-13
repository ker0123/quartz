---
title: Hexo 安装与基础配置
date: 2025-05-29
tags:
  - hexo
---

Hexo 是一个快速, 简洁且高效的博客框架. 使用 Markdown 解析文章, 依照配置好的主题来生成静态网页.

本博客用的就是 Hexo.

## 安装

安装 Hexo 之前要先安装 Git 和 Node.js. Git 的安装不在这里说明, 只说明安装 Node.js.

```sh
# 如果没有 curl, 要先安装 curl
sudo apt-get install -y curl
# 下载安装脚本
curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
# 运行安装脚本
sudo -E bash nodesource_setup.sh
# 安装 Node.js
sudo apt-get install -y nodejs
# 验证安装结果
node -v
```

安装好 Node.js 后, 开始安装 Hexo.

```sh
# 安装 hexo
npm install -g hexo-cli
# 启动 hexo
cd ~
mkdir hexo
hexo init hexo
cd hexo
npm install
```

## 配置

可以在 `_config.yml` 中修改大部分的配置. 具体配置项及其含义见[官方文档配置章节](https://hexo.io/zh-cn/docs/configuration).

最开始, 这个网站主要修改了:

```yml
# Site
title: Ker's site.
subtitle: 'ker0123 的个人网站, 记载了他一段时间的所学.'
description: '网站开始于 2025 年 5 月, 自己大学毕业的后几天. 实际上已经工作快半年了. 这段时间发觉自己的技术栈还是太浅了, 对于软件这一块, 尤其是互联网软件, 相关知识及其欠缺. 于是租了个服务器, 开始一边学习一边尝试自己写一些东西.'
keywords:
author: ker0123
language: ch
timezone: 'Asia/Shanghai'

# URL
## Set your site url here. For example, if you use GitHub Page, set url as 'https://username.github.io/project'
url: http://www.kers.site
```

后来, 网站引入了 Icarus, 网站界面焕然一新.

Icarus 的项目地址在[这里](https://github.com/ppoffice/hexo-theme-icarus), 本网站还参照了[这篇文章](https://www.alphalxy.com/2019/03/customize-icarus)对主题进行了修改.

## 常用命令

```sh
# 创建和发布文章
hexo new [layout] <title>

# 清除网站缓存
hexo clean == hexo c

# 生效新增, 修改, 更新的文件
hexo generate == hexo g

# 一键本地启动
hexo clean && hexo g && hexo s
```
