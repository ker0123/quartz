---
title: .gitignore 不是惟一一种忽略 Git 文件的方式
date: 2026-06-29 08:43:23
tags:
  - git
  - gitignore
---

> 转载自 [.gitignore Isn’t the Only Way To Ignore Files in Git | Nelson Figueroa](https://nelson.cloud/.gitignore-isnt-the-only-way-to-ignore-files-in-git/)

我使用 Git 这么久了, 直到最近才意识到可以在三个不同的级别忽略文件, 而不仅仅是使用 `.gitignore`. 可以用来忽略文件的三个文件是:

- `.gitignore`
- `.git/info/exclude`
- `~/.config/git/ignore`

<!--more-->

## .gitignore

`.gitignore` 是我们通常用来写需要忽略文件的常规文件. 它会和其余的代码一起提交到 Git 中. 添加到这里面的任何文件在运行 Git 命令时都不会被考虑.

## .git/info/exclude

`exclude` 文件位于每个 Git 仓库的 `.git` 目录中, 但对它的修改不会提交到 Git. 在全新的 Git 仓库中, 它通常有几行注释. 该文件对于在每个仓库的基础上忽略特定文件很有用. 例如, 你可能在仓库中有一个个人的 `notes.txt` 文件, 你不想把它提交到 Git, 但也不想把它加到 `.gitignore` 里, 因为它是你个人工作流独有的. 在这种情况下, 你可以把 `notes.txt` 添加到 `.git/info/exclude` 中.

## ~/.config/git/ignore

这个 `ignore` 文件位于你机器的主目录 `~/.config/git/ignore` 下. 添加到这个文件中的任何文件名都会在机器级别的全局范围内被忽略. 该文件不会提交到 Git, 也不与任何特定仓库关联. 这是一个非常好的地方, 用来添加你想在电脑上每一个 Git 仓库中都忽略的文件. 例如, 如果你使用的是 macOS, 在这里添加 `.DS_Store` 就非常理想.

你可以自定义全局 ignore 文件为不同的文件. 例如, 如果你想让你的全局 git ignore 文件名为 `.gitignore_global`, 你可以运行以下命令:

```sh
git config --global core.excludesFile ~/.gitignore_global
```

如果你想恢复默认设置, 运行:

```sh
git config --global --unset core.excludesFile
```

## 检查是哪个文件忽略了特定文件

当你向这些文件中的任何一个添加了文件名时, 你可以使用以下命令来检查文件是如何被忽略的. 例如, 如果你想检查 `.DS_Store` 是如何被忽略的, 可以在任何 Git 仓库中运行 `git check-ignore -v .DS_Store`.

当仓库的 `.gitignore` 忽略了 `.DS_Store` 时, 输出如下:

```sh
$ git check-ignore -v .DS_Store
.gitignore:1:.DS_Store	.DS_Store
```

当仓库的 `.git/info/exclude` 忽略了 `.DS_Store` 时, 输出如下:

```sh
$ git check-ignore -v .DS_Store
.git/info/exclude:7:.DS_Store	.DS_Store
```

当全局的 `~/.config/git/ignore` 文件忽略了 `.DS_Store` 时, 输出如下:

```sh
$ git check-ignore -v .DS_Store
/Users/nelson/.config/git/ignore:2:.DS_Store	.DS_Store
```

当自定义的全局 ignore 文件 `.gitignore_global` 忽略了 `.DS_Store` 时, 输出如下:

```sh
$ git check-ignore -v .DS_Store
/Users/nelson/.gitignore_global:1:.DS_Store	.DS_Store
```

如果没有配置忽略该文件, `git check-ignore -v` 命令将不会产生任何输出.
