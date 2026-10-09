---
title: 移除 Sublime Text Build 4200 的证书授权检查
date: 2026-02-12 07:34:51
tags:
  - sublime
  - crack
  - windows
---


Sublime Text 4 本身是能够免费使用的, 但是如果不购买证书, 标题栏永远会显示 "UNREGISTERED", 时不时还有一个请求赞助的弹窗. 稍微有些烦人.

通过二进制打开可执行文件, 修改几位编码, 就能移除该证书检查.

注意: Sublime Text 是一款很好的软件, 如果有钱一定要去支持一下开发者. [官网证书](https://www.sublimehq.com/store/text)售价 99 美元.

## 操作步骤

首先, 找到可执行程序并备份. 可以直接用命令行, 也可以在文件管理手动复制.

```sh
# 任意方式找到安装路径
which subl # unix like shell
gcm subl # pwsh

# 复制一份原版备份, 一份用来破解
cp sublime_text.exe sublime_text.exe.crack
cp sublime_text.exe sublime_text.exe.bak
```

然后用 Sublime Text 自己打开待破解的备份. 因为电脑不一定安装了其它编辑器, 就算安装了, 也不一定能以字节码形式编辑文件. 但 Sublime Text 自身肯定能.

```sh
subl sublime_text.exe.crack
```

**查找并修改字节数据**: `0fb6 5105 83f2 01` -> `c641 0501 b200 90`.

按下 `ctrl` + `h` 打开查找替换界面, 输入以上内容并替换.

![sublime-replace](sublime-replace.png)

最后关闭 Sublime Text, 使用刚刚修改好的 `sublime_text.exe.crack`, 替换掉 `sublime_text.exe`.

```sh
cp sublime_text.exe.crack sublime_text.exe
```

此时正常打开 Sublime Text, 发现证书授权呈现出已通过的状态.

![sublime-after-crack](sublime-after-crack.png)

该方法不一定每个版本都有效, 修改前一定要先备份, 否则改不回来的话, 就得灰溜溜地去重装了.

> 我在 GitHub 上, [Fadi002 的文章](https://gist.github.com/Fadi002) 中学到了这种方法, 后续如果不兼容, 可以去看看该作者是否同步更新了方法.
