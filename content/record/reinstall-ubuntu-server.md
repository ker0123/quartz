---
title: 重装 ubuntu 服务器记录
date: 2026-07-18
tags:
  - linux
  - server
  - record
---

因为之前一直默认在 root 账户下使用 ubuntu, 后来做一些事情发现在个人账户下更好, 于是决定整体重装.

重装的内容大概是: nginx, rustdesk, hexo, openlist, radicale.

## 创建个人用户

用下面命令交互式创建用户

```bash
adduser ker0123
```

然后给用户 sudo 权限

```bash
usermod -aG sudo ker0123
```

最好就可以退出, 重新使用 `ssh ker0123@kers.site` 远程登录个人用户了.

## 安装额外的包管理器 Homebrew

### 直接安装 ✖️

直接执行官网提供的安装命令, 会卡住:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

一看 url 就知道, github 的链接, 国内访问起来很不稳定.

### 尝试引入清华源安装 ✖️

于是引入 [清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/help/homebrew/).

临时设置一下环境变量(可以长期替换, 命令有所不同, 详见上面的官网):

```bash
export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
export HOMEBREW_INSTALL_FROM_API=1
export HOMEBREW_API_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles/api"
export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"
```

下载安装脚本并执行安装

```bash
git clone --depth=1 https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/install.git brew-install
/bin/bash brew-install/install.sh

# 也可从 GitHub 获取官方安装脚本安装, 但内容下载还是走的清华源
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

清华源下载有时还要排队, 我前面 300 多个人, 中途还可能失败并重新排队.

### 安装代理软件再安装 homebrew ✔️

于是我尝试了先 [安装代理软件](#安装代理软件-clashctl).

开启代理后, 直接使用官方脚本安装, 也是毫无问题.

安装完成之后, 按照提示为 Homebrew 添加环境变量(后续要切换到 nushell, 还得再添加一遍)

```bash
# 添加环境变量到 bash 配置(为什么不直接用 vim?)
echo >> /home/ker0123/.bashrc
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"' >> /home/ker0123/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"
# 安装 homwbrew 的依赖
sudo apt-get install build-essential bubblewrap
```

## 安装代理软件 clashctl

使用了这个项目: [nelvko/clash-for-linux-install](https://github.com/nelvko/clash-for-linux-install)

### 下载 release 再安装 ✖️

在能够访问 girhub 的个人电脑上, 下载好安装包, 用 scp 推送到服务器

```bash
scp clash-linux-arm64-2023.08.17.gz ker0123@kers.site:~/download/
```

解压文件

```bash
cd ~/download
gzip clash-linux-arm64-2023.08.17.gz
```

然后发现解压出来的文件没法使用, 去项目一看, 那不是正确的安装方式.

### 使用中转站在线安装 ✔️

正确的安装方式是使用中转站访问 github, 下载它的安装脚本然后安装:

```bash
git clone --branch master --depth 1 https://gh-proxy.org/https://github.com/nelvko/clash-for-linux-install.git \
  && cd clash-for-linux-install \
  && bash install.sh
```

执行安装脚本时提示缺少 unzip 软件包, 所以我需要先用 apt 安装 unzip. 注意这之前还要 [引入镜像源](#引入镜像源).

```bash
sudo apt update
sudo apt install unzip
```

先前第一次安装失败了, 但已经下载好了安装用的文件, 这次我们直接进入下载好的文件夹手动安装

```bash
cd ~/desktop/clash-for-linux-install
bash install.sh
```

安装时发现安装目录默认为 ~/clashctl. 可以修改 .env.install 文件, 将其改为 ~/opt/clashctl, 然后再执行安装脚本.

后来发现下载还是太慢, 下载到一半还会失败. 只能删除下载了一半的文件重新执行安装脚本下载.

尝试在 [GitHub Proxy 最新地址发布](https://ghproxy.link) 找到可用的中转, 同样替换 .env.install 中的对应选项.

又尝试了更改下载超时时间为 300 秒. 经过漫长的下载之后, 终于安装成功了.

正常导入订阅链接, 开始使用. 之后访问 github 和各种软件源就很顺畅了.

## 为 apt 引入镜像源

先搜罗一下镜像源

```plaintext
# 阿里云
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

# 清华
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse

# 中科大
deb https://mirrors.ustc.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ focal-security main restricted universe multiverse

# 网易 163
deb http://mirrors.163.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.163.com/ubuntu/ focal-backports main restricted universe multiverse
```

使用时需要把 `focal` 替换为你当前的 ubuntu 版本代号. 常用的版本代号有:

```plaintext
Ubuntu 22.04：jammy
Ubuntu 20.04：focal
Ubuntu 18.04：bionic
Ubuntu 16.04：xenial
```

我决定用中科大镜像源, 于是我修改 `/etc/apt/sources.list` 文件, 替换里面的内容为:

```plaintext
# Ubuntu sources have moved to /etc/apt/sources.list.d/ubuntu.sources

# ustc main
deb https://mirrors.ustc.edu.cn/ubuntu/ jammy main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ jammy-security main restricted universe multiverse
```

然后执行更新, 就能使用镜像源下载软件了

```bash
sudo apt update
sudo apt install unzip
```

## 切换到 nushell

### 使用 Homebrew 安装 ✖️

刚才安装了 Homebrew, 所以可以使用 brew 安装 nushell.

```bash
brew install nushell
```

之前开启的代理可能没有生效, 导致下载速度很慢. 于是临时配置一下全局代理

```bash
export ALL_PROXY=socks5://127.0.0.1:7891
```

之后也要记得将该代理配置写入 nu 的启动配置中.

安装完之后, 我尝试将其设置为当前账户的登录 shell, 发现不行, 因为它并未被注册为可用的登录 shell.

还是尝试全局安装吧.

### 使用 apt 安装 ✔️

先卸载刚才安装好的 nushell

```bash
brew uninstall nushell
```

引入 nusell 的 apt 源, 然后安装:

```bash
curl -fsSL https://apt.fury.io/nushell/gpg.key | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/fury-nushell.gpg
echo "deb https://apt.fury.io/nushell/ /" | sudo tee /etc/apt/sources.list.d/fury.list
sudo apt update
sudo apt install nushell
```

最后终于可用设置登录 shell

```bash
cat /etc/shells
#/bin/sh
#/usr/bin/sh
#/bin/bash
#/usr/bin/bash
#/bin/rbash
#/usr/bin/rbash
#/usr/bin/dash
#/usr/bin/screen
#/usr/bin/tmux
#/usr/bin/nu
chsh -s /usr/bin/nu ker0123
```

### 配置环境变量和代理

之前有 3 个地方对 shell 进行了环境配置:

1. clashctl
2. Homebrew
3. 全局代理配置

我们要一个一个地把它们移植到 nushell.

我们先查看 .bashrc 新增的内容, 看能否直接把内容移植到 nushell 的 config

```bash
export CLASHCTL_HOME=/home/ker0123/opt/clashctl
. $CLASHCTL_HOME/scripts/cmd/clashctl.sh

eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"
```

#### 网络代理 - 简简单单

在 $nu.env-path 新增几个环境变量即可:

```plaintext
# proxy
$env.http_proxy = "http://127.0.0.1:7890"
$env.https_proxy = "http://127.0.0.1:7890"
```

#### clashctl - 无需移植

发现 clashctl 将自己的程序入口加入了环境变量, 然后又运行了一个启动脚本.

查看启动脚本内容:

```bash
#!/usr/bin/env bash

. "$CLASHCTL_HOME"/.env

for lib_file in "$CLASHCTL_HOME"/scripts/lib/*.sh; do
    . "$lib_file"
done

for cmd_file in "$CLASHCTL_HOME"/scripts/cmd/*.sh; do
    case "$cmd_file" in *clashctl.*) continue ;; esac
    . "$cmd_file"
done

clashctl() {
    local sub_cmd
    sub_cmd=${1:-help}
    shift

    case $sub_cmd in
    -h | --help | help) sub_cmd=help ;;
    esac

    local target="clash${sub_cmd}"
    declare -F "$target" >&/dev/null || {
        _failcat "Unknown subcommand: $target"
        _failcat "Use 'clashctl help' for usage information."
        return
    }
    "$target" "$@"
}
```

发现它用 bash 运行了一堆其它脚本来做初始化.

还发现所有 clashctl 的子命令实际上都是在运行脚本.

那就彻底没法移植了. 只能进入 bash, 输入 `clashctl` 再回到 nu.

有过疑问: 退出 bash 后, 代理还生效吗? 实际上是生效了, clashctl 只负责各种方式调用 mihomo 命令, 用 `ps` 查看进程, 也只能看到 mihomo, 而看不到 clashctl.

实际测试, 进入 `bash`, 开启 `clashctl on`, 再 `exit`. 在 nushell 中, 代理依然生效:

```bash
bash
clashctl on
exit
curl
curl -s --max-time 5 https://www.google.com -o /dev/null -w "%{http_code}"
#200
```

原先打开的 webui 现在依然可用访问.

将来就凑合着, 每次重启手动进 bash 打开一下代理吧.

#### homebrew - 移植几个环境变量

homebrew 在安装完之后特别提示, 新增了几个环境变量, 去看的话发现是这个:

```bash
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"
```

手动执行 `brew shellenv bash`, 输出是这个:

```plaintext
export HOMEBREW_PREFIX="/home/linuxbrew/.linuxbrew";
export HOMEBREW_CELLAR="/home/linuxbrew/.linuxbrew/Cellar";
export HOMEBREW_REPOSITORY="/home/linuxbrew/.linuxbrew/Homebrew";
export PATH="/home/linuxbrew/.linuxbrew/bin:/home/linuxbrew/.linuxbrew/sbin${PATH+:$PATH}";
[ -z "${MANPATH-}" ] || export MANPATH=":${MANPATH#:}";
export INFOPATH="/home/linuxbrew/.linuxbrew/share/info:${INFOPATH:-}";
```

看起来只是间接地新增了几个环境变量, 不足为惧. 在 $nu.env-path 中也加入这些环境变量即可:

```plaintext
# homebrew
$env.PATH = $env.PATH | prepend "/home/linuxbrew/.linuxbrew/bin"
$env.HOMEBREW_PREFIX = "/home/linuxbrew/.linuxbrew"
$env.HOMEBREW_CELLAR = "/home/linuxbrew/.linuxbrew/Cellar"
$env.HOMEBREW_REPOSITORY = "/home/linuxbrew/.linuxbrew/Homebrew"
$env.MANPATH = $"/home/linuxbrew/.linuxbrew/share/man:(if ($env | get -o MANPATH | is-empty) { "" } else { $env.MANPATH })"
$env.INFOPATH = $"/home/linuxbrew/.linuxbrew/share/info:(if ($env | get -o INFOPATH | is-empty) { "" } else { $env.INFOPATH })"
```

## 安装 rustdesk

是时候把 rustdesk 服务装回来了.

官网提供了 3 种安装方式:

| Method | Best for | Why you would use it |
|--------|----------|--------------------|
| Docker | Most self-hosted deployments | Simplest upgrades, predictable setup, and easy rollback |
| install script | Linux admins who want systemd services quickly | Sets up hbbs, hbbr, and a client config flow with less manual work |
| Debian package | Debian-based systems using package tooling | Keeps installation closer to native package management |

docker 之前试过, 因为有过每次重启都清除软件持续数据的经历, 以及装一堆版本没一个能用, 端口还容易自己混淆的经历, 不想使用.

安装脚本之前一直在用, 装完之后日常使用几乎无感, 挺好的. 只是一直不知道怎么更新, 再执行一次安装脚本?

这次可能会使用 deb 包安装, 不过先让我看看安装脚本是不是能自更新.

... 安装脚本可以覆盖更新, 没理由每次更新都重新下载了, 那更麻烦

```bash
wget https://raw.githubusercontent.com/techahold/rustdeskinstall/master/install.sh
chmod +x install.sh
bash install.sh
```

中途做两下选择, 输入一下域名, 就安装成功了.

需要自己创两个系统服务, 以便开机自启动:

```yml
# /etc/systemd/system/hbbs.service
[Unit]
Description=RustDesk Signal Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/rustdesk
ExecStart=/opt/rustdesk/hbbs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```yml
# /etc/systemd/system/hbbr.service
[Unit]
Description=RustDesk Relay Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/rustdesk
ExecStart=/opt/rustdesk/hbbr
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

创完之后发现不对劲, 我是不是在安装的时候见过类似输出? 去上面翻看了下:

```plaintext
Creating /var/log/rustdesk
Created symlink /etc/systemd/system/multi-user.target.wants/rustdesksignal.service → /etc/systemd/system/rustdesksignal.service.
Created symlink /etc/systemd/system/multi-user.target.wants/rustdeskrelay.service → /etc/systemd/system/rustdeskrelay.service.
```

是的, rustdesk 已经创建好了服务, 只是名称和之前不一样了, 叫 rustdesksignal 和 rustdeskrelay.

于是我灰溜溜地去把自创的那几个删掉了:

```bash
sudo systemctl disable --now hbbs hbbr
sudo rm -f /etc/systemd/system/hbbs.service /etc/systemd/system/hbbr.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
```

> todo: rustdesk 还附带启动了一个 gohttp 服务, 上面提供该服务的对应客户端快速安装脚本, 但是密码太难记了, 之后自己改一下.

> 做完上面这几个, 已经是从晚上 11 点到凌晨 3 点了. 先睡觉.

## 本地备份并恢复文件

重装系统前有把需要备份的文件全部放到挂载的硬盘上, 想着重装完了从硬盘里面取就好了.

我去, 挂载硬盘也要重新做.

挂载完发现之前备份的东西都没了, 向服务器运营商发了工单, 他说我是不是没备份, 所以我去找一下 nushell 的日志...

nushell 的日志存放在 `$nu.history-path`.

一下没找到对应日志, 可能是不记录 ssh 内部的记录. 算了. 于是恢复重装前的备份, 将内容备份好.

大致过程就是:

1. 备份当前系统, 然后回退到重装系统前
2. 列出需要备份的几个点: 包括 `frps`, `nginx`, `openlist`, `radicale`, `ssh`
    - frps 需要备份 `frps.toml` 配置文件
    - nginx 需要备份 `.conf/default.conf` 文件, 还有 `/etc/ssl/certs/fullchain.pem` 和 `/etc/ssl/private/privkey.pem`.
    - openlist 把之前挂载的大量文件备份一下, 然后打开网站, 去设置里面生成好 json 格式的配置文件.
    - radicale 需要备份安装目录下 `collections` 文件夹, 里面是实实在在的日历数据.
    - ssh 需要备份各种密钥对, 还有 `know_hosts` 文件, 以及 `authorized_keys` 文件.
3. 为了保证数据不损坏, 先使用 `tar -cvzf` 将文件打包成 tar.gz, 然后用 `open xx.tar.gz | hash sha256 | save -f sha256.txt` 计算并保存校验值, 每次上传下载完都建议一下完整性.
4. 用 sftp 将文件下载到本地电脑(不使用 scp, 因为没法断点续传). 这一步直接用 FileZilla 可视化操作了, 不多讲
5. 回到当前备份(重装系统后的备份)
6. 用 sftp 将文件上传到服务器, 然后用 `hash sha256` 检查完整性.

## 恢复 nginx 反向代理

后面要安装的服务, 都需要反向代理才能用域名访问. 配置之前已经写好了, 放到对应位置就行.

nginx 也不是默认安装的, 要先用 `sudo apt install nginx` 安装一下, 顺便也把文件夹生成了.

恢复的文件列表如下:

- /etc/nginx/conf.d/default.conf
- /etc/ssl/certs/fullchain.pem
- /etc/ssl/private/privkey.pem

其中 default.conf 的内容如下:

```nginx
# http -> https
server {
    listen 80;
    listen [::]:80;
    server_name kers.site www.kers.site blog.kers.site pan.kers.site cal.kers.site rustdesk.kers.site astrbot.kers.site sillytavern.kers.site zashboard.kers.site napcat.kers.site;
    return 301 https://$host$request_uri;
}

# www, blog -> hexo[4000]
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.kers.site blog.kers.site;

    ssl_certificate     /etc/ssl/certs/full_chain.pem;
    ssl_certificate_key /etc/ssl/private/private.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# pan -> openlist[5244]
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pan.kers.site;

    ssl_certificate     /etc/ssl/certs/full_chain.pem;
    ssl_certificate_key /etc/ssl/private/private.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 文件上传大小限制（云盘需要）
    client_max_body_size 10G;

    location / {
        proxy_pass http://127.0.0.1:5244;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（openlist 可能需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}

# cal -> radicale[5232]
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cal.kers.site;

    ssl_certificate     /etc/ssl/certs/full_chain.pem;
    ssl_certificate_key /etc/ssl/private/private.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location = / {
        return 301 https://$host/radicale/;
    }

    location /radicale/ {
        proxy_pass        http://127.0.0.1:5232/;
        proxy_set_header  X-Script-Name /radicale;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header  X-Forwarded-Host $host;
        proxy_set_header  X-Forwarded-Port $server_port;
        proxy_set_header  X-Forwarded-Proto $scheme;
        proxy_set_header  Host $http_host;
        proxy_pass_header Authorization;
    }
}
```

## 安装 openlist

使用官方提供的安装脚本.

> 话说, 是不是现在服务端软件都是这套, 不走软件包管理器了?

```bash
curl -fsSL https://res.oplist.org.cn/script/v4.sh > install-openlist-v4.sh && sudo bash install-openlist-v4.sh
```

换成 nushell 的写法:

```shell
curl -fsSL https://res.oplist.org.cn/script/v4.sh | save -f openlist-install.sh
bash openlist-install.sh
```

发现下载过程非常慢, 即使使用了代理也很慢.

原来是实际下载时使用的 sudo, 而 root 的 shell 环境没有配置代理, 直连下载当然慢.

使用如下指令, 使 sudo 继承当前用户的环境变量, 然后运行脚本:

```shell
sudo -E bash openlist-install.sh
```

用 systemctl 查找 openlist, 发现已经注册服务, 这部分不用我们操心了:

```shell
systemctl list-units | find openlist
```

openlist 安装位置是 `/opt/openlist`, 里面同样有一个 `openlist` 可执行文件(且写入了环境变量), 可以执行它交互式的管理 openlist 服务:

```plaintext

欢迎使用 OpenList 管理脚本

基础功能：
1、安装 OpenList
2、更新 OpenList
3、卸载 OpenList
-------------------
服务管理：
4、查看状态
5、密码管理
6、启动 OpenList
7、停止 OpenList
8、重启 OpenList
-------------------
配置管理：
9、备份配置
10、恢复配置
-------------------
高级选项：
11、Docker 管理
12、定时更新
13、系统状态
14、关于
-------------------
0、退出脚本

请输入选项 [0-14]:

```

刚重新安装完, 可以在这里重设临时密码, 然后登录网页手动重设密码, 以及用上先前备份的配置.

我发现: 那个 json 格式的配置并不能在管理脚本处恢复, 只能在网页端恢复. 不过硬要说也只是更方便了.

## 安装 hexo

实际上是安装 nodejs 然后拉过来仓库并部署

```shell
sudo apt install nodejs
```
需要把之前的 ssh-key 全拿回来.

中途发现之前的备份没做好, 于是话了很大工夫 [本地备份并恢复文件](#本地备份并恢复文件).

然后需要从 github 上, **用 ssh 的格式**拉取仓库.

发现下载速度特别慢, 明明已经开启了代理, 还是特别慢.

我了解到 ssh 不走 http, 需要为 ssh 命令做配置. 在 `~/.ssh/config` 中加入如下内容:

```plaintext
Host github.com
  HostName github.com
  User git
  ProxyCommand nc -X 5 -x 127.0.0.1:7891 %h %p
```

然后再来下载就快多了.

下载完成后进入目录, 尝试安装依赖并启动:

```shell
npm install
npm run build
npm run server
```

正常启动, 此时使用 IP:port 访问, 已经能看到 hexo 的页面了.

然后配置后台运行, 需要用到全局安装的 pm2 和 hexo-cli.

```shell
sudo npm install -g pm2 hexo-cli
```

然后创建线程:

```shell
pm2 start "hexo server -i 0.0.0.0 -p 4000" --name hexo
```

设置开机自启:

```shell
pm2 startup
```

运行上一句后, 提示:

> [PM2] Init System found: systemd
> [PM2] To setup the Startup Script, copy/paste the following command:
> sudo env PATH=$PATH:/home/linuxbrew/.linuxbrew/Cellar/node/26.5.0/bin /home/linuxbrew/.linuxbrew/lib/node_modules/pm2/bin/pm2 startup systemd -u ker0123 --hp /home/ker0123

我当前使用的是 nushell, 没法照搬命令, 于是先使用 su 进入 root 用户的 bash, 然后执行:

```bash
env PATH=$PATH:/home/linuxbrew/.linuxbrew/Cellar/node/26.5.0/bin /home/linuxbrew/.linuxbrew/lib/node_modules/pm2/bin/pm2 startup systemd -u ker0123 --hp /home/ker0123
```

最后用 `exit` 回到 ker0123 用户, 执行 `pm2 save` 保存当前的进程列表.

至此, hexo 重装完成.

## 安装 radicale

### 安装本体和恢复数据

第一次安装 radicale 的时候, 我遇到过很多问题, 现在看来绝大部分都是因为我使用了 root 用户. 使用个人用户, 照着 [官方教程](https://radicale.org/v3.html#simple-5-minute-setup) 来, 其实很轻松.

找个地方, 创建一个 python 虚拟环境(注意需要 bash 终端下):

```shell
bash
cd ~/desktop/radicale
python3 -m venv venv
source venv/bin/activate
```

直接下载并运行安装脚本:

```shell
python3 -m pip install --upgrade https://github.com/Kozea/Radicale/archive/master.tar.gz
```

启动并分配数据路径

```shell
python3 -m radicale --storage-filesystem-folder=~/.var/lib/radicale/collections --auth-type none
```

导航到数据路径, 将先前备份的数据解压到此:

```plaintext
~/.var/lib/radicale/collections/collection-root> tar -xzvf ~/document/backups/radicale/collection-root.tar.gz
```

### 设置网页密码

需要给 radicale 网站设置一个密码, 这用到了 htpasswd 工具. ubuntu 默认没有安装, 先用 `apt install apache2-utils` 安装一下.

为了方便管理, 我没有按照官方教程那样在用户目录创建密码文件, 而是和 /etc/nginx/ 放在一起.

```shell
htpasswd -c /etc/nginx/.htpasswd ker0123
```

创建配置文件 `~/.config/radicale/config`:

```plaintext
[auth]
type = htpasswd
htpasswd_filename = /etc/nginx/.htpasswd
htpasswd_encryption = autodetect

[server]
hosts = 0.0.0.0:5232, [::]:5232
```

挺复杂的是吧? [官方教程的配置章节](https://radicale.org/v3.html#basic-configuration) 其实拆开来讲了, 还是很清楚的.

### 注册为服务

到这一步, 官方教程告诉我不必自己写, 有人做好了软件包...

> [Ubuntu by the MOTU and Jonas Smedegaard](https://packages.ubuntu.com/radicale)

也是美美地 `sudo apt install radicale` 然后 `sudo systemctl enable radicale` 了.

这种方式装完之后, 它会去哪里找配置文件?

用 `sudo systemctl start radicale` 尝试启动服务的时候, 它会问我以那个用户启动:

```plaintext
==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ====
Authentication is required to start 'radicale.service'.
Multiple identities can be used for authentication:
 1.  Ubuntu (ubuntu)
 2.  ,,, (ker0123)
Choose identity to authenticate as (1-2): 2
Password:
==== AUTHENTICATION COMPLETE ====
```

(我猜测)选择 Ubuntu 并输入密码, 就是 root 账户运行, 首先在 `/etc/radicale/config` 找配置文件; 选择个人用户的话, 就优先在 `~/.config/radicale/config` 找配置文件.

😭️问了 ai, 也自己仔细看了输出, 原来不是选择用户来运行 radicale, 而是选择用户来运行 systemctl. 实际使用的配置只有 `/etc/radicale/config`. 个人用户那边可以删掉了.

由于安装方式变了, nginx 和 `etc/radicale/config` 也要变, 大概就是使用 nginx 的校验代替 radicale 的内部的校验, 也算统一了. 修改的两部分分别是:

```nginx
# cal -> radicale[5232]
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cal.kers.site;

    ssl_certificate     /etc/ssl/certs/full_chain.pem;
    ssl_certificate_key /etc/ssl/private/private.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location = / {
        return 301 https://$host/radicale/;
    }

    location /radicale/ {
        auth_basic "CalDAV/CardDAV";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass        http://127.0.0.1:5232/;
        proxy_set_header  X-Script-Name /radicale;
        proxy_set_header  X-Remote-User $remote_user;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header  X-Forwarded-Host $host;
        proxy_set_header  X-Forwarded-Port $server_port;
        proxy_set_header  X-Forwarded-Proto $scheme;
        proxy_set_header  Host $http_host;
    }
}
```

```config
[auth]

# Authentication method
# Value: none | htpasswd | remote_user | http_x_remote_user
type = http_x_remote_user

```

再次启动并刷新浏览器, 出现登录窗口, 正确地输入用户名和密码, 又报错:

```plaintext
A server error occurred.  Please contact the administrator."
```

去 shell 中用 `sudo journalctl -u radicale -b` 查看最后一次运行日志, 错误内容是:

```plaintext
radicale[52730]: [2026-07-21 12:47:31 +0000] [52730/Thread-1 (process_request_thread)] [ERROR] An exception occurred during GET request on '/.web/': [Errno 13] Permission denied: '/var/lib/radicale/collections/.Radicale.lock'
```

看来是 radicale 用户没有访问 `/var/lib/radicale/collections` 的权限, 那就给它加上权限:

```shell
sudo chown -R radicale:radicale /var/lib/radicale
```

然后直接刷新网页, 终于能够正常访问了!

后面又发现, nginx 验证一次之后, 进去 ker0123 又要输入一次密码. 所以就去掉了 nginx 的验证(回退 nginx 配置), 然后改了 radicale 的 config, 修改了 [auth] 的部分:

```config
[auth]

# Authentication method
# Value: none | htpasswd | remote_user | http_x_remote_user
type = htpasswd

# Htpasswd filename
htpasswd_filename = /etc/nginx/.htpasswd
```

这之后使用体验就和之前一样了(只有密码换了一下)

### 收尾工作

最后把先前备份好的 radicale 数据文件夹原封不动地覆盖到现在的位置, 重进网页, 之前的日历都回来了.

把之前安装时候产生的内容都删一下

```shell
rm -rf ~/desktop/radicale/
rm -rf !/.config/radicale/
rm -rf ~/.var/lib/radicale/
```

## 结束

至此, 所有服务已经安装完毕! 整个过程中还是属性了 linux 系统的各种特性, 以及各种开源软件领域约定俗成的东西, 还有就是各种网络知识, 代理知识. 应该对将来开发软件有很大帮助.

后面打算安装一个新服务, 自托管的密码本. 看看又会碰到什么新东西.
