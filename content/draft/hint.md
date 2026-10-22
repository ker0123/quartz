---
title: Hint
date: 2026-10-22
tags:
  - record
---

- [ ] zed 在 windows 上的命令面板和鼠标兼容这个 issue 一直没改, 考虑 fork.
- nushell 的 `each {|x|...}` 命令, 其中闭包被设计为无法修改外部变量, 这是设计! 它本身会返回一个处理过的 record. 如果要一边遍历一边改外面的值, 用 `for`. 或者简单的统计用 `math`.
