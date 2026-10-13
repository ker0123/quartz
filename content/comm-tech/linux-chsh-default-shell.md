---
title: Linux 切换默认 Shell - chsh
date: 2026-06-16
tags:
  - linux
  - chsh
---

使用 SSH 登录 Linux 服务器时, 默认总是 bash. 每次都要手动切换到自己常用的其它 shell, 很麻烦. 因此想办法设置默认的登录 Shell.

<!--more-->

**注意! 命令输入有误容易导致远程无法登录终端.**

或者删除当前在使用的终端, 也会导致无法登录! 请清楚自己在做什么.

*查看系统中可用的 shell*
```sh
cat /etc/shells
```

*切换当前用户的默认 shell (例如切换到 fish)*
```sh
chsh -s /usr/bin/fish
```

*切换其它用户的默认 shell (例如 ker0123)*
```sh
chsh -s /usr/bin/fish ker0123
```

也可以直接编辑配置文件 `/etc/passwd`, 用任意方式打开(需要 root 权限), 找到并做如下修改:  
```sh
- ker0123:x:1000:1000:User Name:/home/ker0123:/bin/bash
+ ker0123:x:1000:1000:User Name:/home/ker0123:/usr/bin/fish
```

可以使用 `pwck` 命令检查 `/etc/passwd` 是否存在错误.

> 对于 Windows, 没有切换默认终端一说. 它永远是 `cmd`.
>
> 不过在使用 `ssh` 登录到 Windows 时, 可以通过在 `sshd_config` 文件中加上一行 `ForceCommand pwsh`, 以在登录时用 `cmd` 强行执行一条命令, 间接地切换默认终端.
>
> 这也会导致大部分的 `sftp`(ftp over `ssh`) 不可用, 因为登录的返回信息变的不同了.
