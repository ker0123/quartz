---
title: 通过公网访问个人电脑的 SSH 服务 (基于 frp 内网穿透)
date: 2026-02-11 10:08:53
tags:
  - ssh
  - frp
---

在个人电脑上安装 OpenSSH Server 服务, 然后使用 frp 内网穿透, 将服务暴露在公网上.

<!--more-->

## 需要准备

- 能访问公网的 Windows 个人电脑
- 有公网 IP 的 Linux 服务器

## 安装 sshd

一般来说, Linux 发行版默认带有 `ssh` 服务. 如果没有, 用任意包管理器安装 `sshd` 即可.

而 Windows 可以在 "设置 > 可选功能 > 添加功能" 中启用 OpenSSH Server.

如果找不到, 直接去 GitHub 上找 OpenSSH 或者使用 scoop 安装一个吧.

安装完毕后, 还需要到 "任务管理器 > 打开服务" 中将 OpenSSH Server 的**两个**相关服务设置为自动启动, 并手动启动一次.

![start-sshd-service](start-sshd-service.png)

*如果找不到该服务, 请检测 OpenSSH Server 是否安装成功, 或者重启电脑再去查找*

### Windows 配置 - 真实用户名和密码

外部想使用 `ssh` 登录 Windows 系统, 如果不使用公钥, 则需要输入帐户密码. 在常见的 Windows 系统中, 除非你使用的是本地帐户, 否则锁屏密码不一定是当前用户的密码, 而是 PIN 码; 微软帐户名也不一定是当前用户的用户名.

如果使用微软帐户登录, 你可以在终端输入 `cd ~`, 然后输入 `pwd`, 所显示的家目录的最后一段就是当前的用户名.

如果使用微软帐户登录, 电脑密码将与微软帐户密码相同.

如果使用的是本地帐户登录, 那么解除锁屏时的帐户和密码便是 `ssh` 可用的帐户和密码. 不过现在的 Windows 系统安装时就会要求登录 Microsoft 账号, 你的电脑大概率使用的不是本地帐户.

可以采用断网装系统的方式默认使用本地帐户(Win11 需要额外输入一些命令, 自行查询). 如果已经有了帐户, 不建议再新建本地帐户 ---- 权限和用户配置都会各种缺失.

### Windows 配置 - 公钥登录

如果是 Windows 系统, 安装完之后想要配合 `authorized_keys` 文件, 让外部使用公钥登录, 除了手动创建这个文件, 还需要更改 `sshd_config` 中的配置.

该文件位于 `C:\ProgramData\ssh\sshd_config`. 它配置了整个系统的 OpenSSH Server.

有两种方式使用公钥登录, 一种是不改变配置, 按照默认配置文件给出的路径 ---- 即 `__PROGRAMDATA__/ssh/administrators_authorized_keys` ---- 在 `C:\ProgramData\ssh\sshd_config` 下创建 `administrators_authorized_keys` 文件, 并将外部的公钥一行一个, 写在该文件里.

另一种方式就是改变配置, 不使用统一用户组的 `authorized_keys` 文件, 而是使用用户目录下的 `authorized_keys`. 你需要删除 `administrators_authorized_keys` 的以下内容:

```yaml
Match Group administrators
       AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

然后在 `~/.ssh` 中创建自己的密钥对, 以及 `authorized_keys` 文件, 记录外部设备的公钥.

## 安装 frp

需要同时在个人电脑和服务器安装 frp. 服务器端安装的是 `frps`(server), 个人电脑安装的是 `frpc`(client).

你可以使用包管理器, 手段下载压缩包并解压... 等任意手段安装 frp. frp 以单文件方式运行, 安装并不困难.

安装好后, 需要分别创建配置文件. 服务器上, 在 `frps` 的同级目录下创建 `frps.toml`; 个人电脑上, 在 `frpc.exe` 的同级目录下创建 `frpc.toml`.

以下是最简的一套内网穿透配置.

服务器上:
```ini
# frps.toml

# 服务器在端口 7000 上监听 frp 相关请求
bindPort = 7000

```

个人电脑上:
```ini
# frpc.toml

# 绑定 frps 服务器为 kers.site, 端口为 7000
serverAddr = "kers.site"
serverPort = 7000

# 将本地电脑的端口 22(sshd 服务默认端口) 映射到服务器端口 6000
[[proxies]]
name = "sshd"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000
```

配置创建完毕后, 可以尝试分别启动服务. 服务器上执行 `./frps -c ./frps.toml`, 个人电脑上执行 `./frpc.exe -c ./frpc.toml`.

使用第三台安装了 `sshd` 客户端的电脑, 通过命令行执行 `ssh kerol@kers.site -p 6000`(kerol 换成个人电脑用户名; kers.site 换成自己的服务器域名), 如果出现输入密码的界面, 代表配置成功.

*如果没有成功, 最有可能是因为你关闭了执行 frp 命令的终端, 导致内网穿透服务提前结束. 请保留对应终端进行连通测试*

*后续会将如何将 frp 注册为系统服务, 开机自启动且在后台保持运行*

运行原理为: 内网穿透建立后, 访问公网服务器的 6000 号端口, 就相当于访问个人电脑的 22 号端口. 个人电脑的 `sshd` 服务就运行在这个端口上. 从此, 任意能访问公网服务器的设备, 便可通过这个映射关系访问个人电脑的 `sshd` 服务.

## 注册为系统服务

在 Linux 上将 frp 注册为系统服务, 主要使用 `systemd`. 做法比较通用, 可以根据这个 [官方教程](https://gofrp.org/zh-cn/docs/setup/systemd/) 来.

在 Windows 上, 系统服务比较古老, 需要软件提供一些特定的接口, frp 不支持直接注册为 Windows 系统服务, 需要使用一些中间层.

常见的将应用注册为系统服务的中间层软件有: winsw, nssm. 推荐使用 nssm(Non-Sucking Service Manager), 它操作简单, 不用写一堆配置文件.

同样的, 使用任意方式安装 nssm. 从[官网下载](https://nssm.cc/download), 或者使用 scoop 包管理器运行 `scoop install nssm`.

然后在命令行运行 `nssm install frpc`, 以 GUI 交互的形式, 填写服务参数, 注册 frpc 服务.

![nssm-install-frpc](nssm-install-frpc.png)

path 中填写 `frpc.exe` 的路径; argument 中填写 `-c` + 配置文件的路径. 你可以顺便在 detials 页签中设置一下服务名称和描述.

配置文件需要手动创建, scoop 已经为我创建好了 `frpc.toml`, 但是你可以将 `frpc.toml` 创建在任意你喜欢的目录下.

服务安装完成之后, 就如同安装好 OpenSSH Server 后一样, 到系统服务中将其设置为自启动. 之后, 你可以尝试重启个人电脑, 测试第三方是否仍然能使用 `ssh` 打开个人电脑的命令行.
