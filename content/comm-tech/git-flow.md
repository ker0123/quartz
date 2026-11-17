---
title: git 的分支策略
date: 2026-11-17
tags:
  - git
---

最开始, 我只是在网上搜了 "git 如何使用分支". 然后搜到一张有 `main`, `develop`, `release`, `feature/**`. `hotfix/**` 的图. 然后就拿着去用了.

用着用着, 发行有些操作过于复杂: 如果 main 分支没被保护, 直接在 main 上提交也没关系; release 分支更是多余, 我直接 develop 分支上做测试不也行? feature 分支用的挺多, 但大部分时候在 develop 上 commit, 只有开发到一半环境不稳定时, 才会从前面拉一个 feature 分支开发另外一个功能. hotfix 用的时候不错, 但是 fix 完了合并阶段有点烧脑...

后面又偶尔在 github 上用 pull request. 发现搭配起来更不知道怎么拉分支怎么合并了

今天仔细研究了下这个问题, 发现这就是 "分支策略", 而我最开始学的那个, 是最经典最久远的 "git flow", 自己简化过后的很像 "gitlab flow" 的其中一种. 另外还有 "github flow", 和 pull request 一同出生.

到最后也没明白各种分支策略怎么用. 不过现在用的这个可以稍微优化一下:

- develop 在要发布前(已经确定不会再新增功能, 而是只修复测试 bug, 变更版本号)的时候, 决定好下个版本的版本号, 然后每次变更打 vX.Y.Z-rc.N 的 tag.
- develop 分支合并到 main 分支之后, 打上 vX.Y.Z 的 tag. 代表正式版发行
- 要从上个正式版拉取并修复 bug, 从 main 拉分支, 版本号 + 0.0.1. 同样的 vX.Y.Z-rc.N tag, 改完后合并到 main, 打 vX.Y.Z tag. 随后马上将 main 分支再合并到 develop 分支.

弄不明白更多的分支策略, 可能是因为自己对这些策略的思考不够多. 目前再试试用 github flow 维护几个仓库, 体验一下.
