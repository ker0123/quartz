---
title: zoxide (windows) 快速安装配置指南
date: 2026-06-25
tags:
  - zoxide
  - windows
---

[zoxide](https://github.com/ajeetdsouza/zoxide) 是一款命令行的快速导航工具. 配置完之后, 可以使用 `z` 非常快捷地跳转到经常访问的目录.

这里讲 Windows 下如何快速安装和配置.

## 安装

如果之前安装了 scoop, 可以直接使用 `scoop install zoxide` 安装.

另外, 只要安装了 Cygwin, Git Bash, 或 MSYS2, 其中任意一种, 你可以使用在线脚本来安装 zoxide. 只需在能使用 curl 的终端中执行:

```sh
curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
```

## 配置 shell

### cmd(命令行提示符)

不支持. windows 下至少有 pwsh 1.0 吧? 最低用那个也行.

### pwsh(PowerShell)

在 `$PROFILE` 文件**末尾**中添加以下内容:

```pwsh
Invoke-Expression (& { (zoxide init powershell | Out-String) })
```

如果不清除 `$PROFILE` 文件是什么, 在哪里. 参考以下命令

```pwsh
# 查看 $PROFILE 的路径
$PROFILE
# 看文件是否存在
Test-Path -Path $PROFILE
# 如果不存在, 创建文件
New-Item -Path $PROFILE -ItemType File -Force

# 直接使用单条命令保证文件存在
if (!(Test-Path $PROFILE)) { New-Item -Type File -Path $PROFILE -Force }

# 用记事本打开文件
notepad $PROFILE
```

### nushell

在 $nu.env-path 指向的文件中添加以下内容:

```sh
zoxide init nushell | save -f ~/.zoxide.nu
```

然后, 在 $nu.config-path 指向的文件中添加以下内容:

```sh
source ~/.zoxide.nu
```
