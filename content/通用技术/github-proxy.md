---
title: "Git 无法连接 Github: 代理问题"
date: 2026-06-16 09:46:00
tags:
  - github
  - proxy
---

无法与 github 连接的情况下(一般国内环境都无法直连), 使用 `git config --global` 设置全局代理.

<!--more-->

```sh
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy https://127.0.0.1:7897
```

**但是!** 如果仓库使用的是 ssh 协议, 仓库地址类似于 `git@github.com:user/repo.git`, 代理设置不会生效.

Github 的 ssh 连接没有被墙, 如果连接不上, 不是代理配置的问题.

~~我自己的话是重启电脑解决的~~
