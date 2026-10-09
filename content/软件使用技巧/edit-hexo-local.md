---
title: 通过 Github Action, 本地编辑 Hexo 博客并自动部署
date: 2026-06-15 20:20:01
tags:
  - hexo
  - github-action
---

Hexo 博客的源文档存放在服务器上, 通过 ssh + vim 编辑太为硬核, 通过 vscode + ssh-remote 编译会爆内存. 最终找到这个基于 Github Action 的本地编辑, 远程部署的方案.

这是我使用 vscode + ssh-remote 插件编辑文档时, 服务器资源的占用:

![常态占 1G 内存, 峰值直接到顶, CPU 偶尔到顶导致远程手段卡住](vscode-cause-bad.png)

首先考虑的是换个编辑器, 直接用终端 + ssh 连接和使用命令行部署, 用 yazi 做导航, 用 vim 做编辑, 可行但是太硬核了; 使用 webdev 同步比较方便, 但是没法远程部署.

最后想到使用 git 来同步, 使用 github action 来部署.

---

## 1. 将仓库上传到 github

![hexo 的文章源放在 source 文件夹中](hexo-files.png)

Hexo 的文章源一般只放在 source 文件夹中, 其它文件夹大部分是 Hexo 在配置和部署时生成的, 可以不加入版本控制.

> 加入版本控制也是一种做法. 可以用 .gitignore 忽略掉生成的文件, 然后在编写的时候, 可以使用本地 Hexo 来预览式地部署.
>
> 另外, 这样做, 项目的意义也更明显, 文件根路径也更加合理, 同时也方便随时更改配置.

先在 github 上创建一个空仓库. 不要选择 README.md, .gitignore 和 license 文件, 仅是空仓库即可.

然后复制并保存好仓库的 ssh 地址(为什么是 ssh 而不是 https, 之后会说). 例如 `git@github.com:ker0123/hexo.git`.

上传到 github 的命令可以参考如下. 基本就是本地初始化仓库, 然后为仓库设置远程地址, 最后提交和推送.

如果要上传整个 hexo 文件夹:  
```bash
cd /path/to/hexo
git init

# 忽略掉不需要进行版本控制的文件
echo "node_modules/
public/
db.json
" > .gitignore

git add .
git commit -m "init commit"
git branch -M main
git remote add origin git@github.com:ker0123/hexo.git
git push -u origin main
```

如果只上传 source 文件夹:  
```bash
cd /path/to/hexo/source
git init
git add .
git commit -m "init commit"
git branch -M main
git remote add origin git@github.com:ker0123/hexo.git
git push -u origin main
```

## 2. 配置 github action

在浏览器中操作较为方便. 进入创建好的 github 上的仓库, 进入 Actions, 选择创建一个空的 workflow, 更名为 `deploy.yml`. 然后填入以下内容.

![找到新建空 workflow](new-action.png)

```yaml
name: deploy on server

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: execute deploy script on server
        uses: appleboy/ssh-action@v1.2.5
        with:
          host: kers.site
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: /root/hexo/deploy.sh
```

> 如果更注重隐私, 可以将 host 和 username 也作为 secrets.

然后来到服务器. 在 Hexo 文件夹中创建一个部署脚本 `deploy.sh`, 内容如下. 脚本做的事很简单: 拉取最新代码, 使用 `hexo c && hexo g` 来重新生成静态博客文件.

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/source"

git fetch origin main
git checkout main
git reset --hard "origin/main"

hexo clean && hexo generate
```

直接提交这个脚本到远程仓库, 触发 workflow, 发现执行失败.

![错误信息是 `error: can't connect without a private SSH key or password`](action-failed.png)

我们需要创建一对 ssh 密钥, github 远程仓库持有私钥, 服务器中持有公钥(保存在 `~/.ssh/authorized_keys` 中). 这样 github action 才可以通过 ssh 连接到服务器上执行部署脚本.

首先在任意机器上生成密钥对

```bash
ssh-keygen -t ed25519
# 中间会交互式地让你确定文件名等信息, 这里选择了 `id_ed25519_gh`.

# 将公钥添加到服务器的 authorized_keys 中
cat ~/.ssh/id_ed25519_gh.pub > ~/.ssh/authorized_keys

# 显示私钥内容, 以复制到 github secrets 中
cat ~/.ssh/id_ed25519_gh
#-----BEGIN OPENSSH PRIVATE KEY-----
#b3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#Qyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#pgxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#Usxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==
#-----END OPENSSH PRIVATE KEY-----
```

然后添加到仓库 secrets 中.

![添加 secrets](add-secret.png)

在 github 上手动触发 workflow, 此时应该能部署成功.

![手动触发 workflow](run-action-manual.png)

以后, 每次在本地编辑完文章, 只需推送到主分支, github 便会自动调用服务器部署脚本, 完成 Hexo 博客的自动部署.
