---
title: 在 Hexo 上写加密笔记
date: 2026-01-30
tags:
  - hexo
  - private
---

使用 `hexo-blog-encrypt` 插件, 或 ngnix 反向代理设置密码认证, 达到需要一定门槛才能访问笔记的目的.

建议直接使用 ngnix 反向代理为某个域名加密. 搭配 page 类型文章使用体验更佳.

也可以使用 `hexo-blog-encrypt` 为笔记加密. 不过就像项目描述说的: 不够安全.

## ngnix + page 方式

### ngnix 配置


ngnix 反向代理能为某个域名设置 "需要认证". 以该站点下 auth 路径为例:

```
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

    # 为 /auth 目录设置认证, 需要在 /etc/nginx/.htpasswd 中添加用户名和密码
    location /auth {
        auth_basic      "需要认证";
        auth_basic_user_file    /etc/nginx/.htpasswd;
        # 并不会继承配配置, 所以要重写一遍
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

这样添加帐户和密码:

```sh
# 第一次 - 创建文件并添加一个帐户密码
sudo htpasswd -c /etc/nginx/.htpasswd username

# 后续 - 无需再次创建文件
sudo htpasswd /etc/nginx/.htpasswd username2

# 修改密码 - 输入相同的用户名, 会提示修改密码
sudo htpasswd /etc/nginx/.htpasswd username

# 记得修改文件权限
sudo chmod 640 /etc/nginx/.htpasswd
sudo chown www-data:www-data /etc/nginx/.htpasswd # Debian/Ubuntu
# 或
sudo chown nginx:nginx /etc/nginx/.htpasswd # CentOS/RHEL
```

### Hexo 使用

Hexo 的 page 类型文章, 创建之后路径可控, 且无法从主页任何地方导航到此(只有你自己知道这个地址).

```sh
hexo new page auth
```

创建之后会自动生成一个 index.md, 作为页面的主页. 直接进入 hostname.com/auth 将显示该页面.

将任何文章放入该文件夹, 该文章将从正常的 Hexo 文章列表中消失(不能在分类, tag, 时间线等任何地方找到), 但是可以通过引用路径访问.

例如, 将 passwords.md 放入 auth 文件夹, 然后路径下有这些文件.

```sh
hexo
|-- source
    |
    -- auth
        |
        -- index.md
        -- passwords.md
```

可以直接在 index.md 下, 如此引用, 以导向 passwords.md:

```md
[密码本](passwords)
```

注意不需要 .md 后缀.

直接使用链接也行: `www.kers.site/auth/passwords`.

> 别试了, 当然不可能是真实路径.

## hexo-blog-encrypt 方式

这里是 [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt) 的项目地址.

可以直接去查看官方快速使用文档, 这里基本上是其摘录.

注意如果是其它人的设备, 用完记得清除浏览器缓存的站点数据. 否则他下一次进入时不需要密码.

### 安装 `hexo-blog-encrypt`

```sh
# 导航到 hexo 目录
cd ~/hexo
# 使用 npm 安装 hexo-blog-encrypt
npm install --save hexo-blog-encrypt
```

### 快速使用

将 `password` 字段添加到您文章信息头, 就像这样:

```yml
---
title: Hello World
date: 2016-03-30 21:18:02
password: hello
---
```

需要重启生成文章, 重启服务器, 才能最终看到效果.

### 清除浏览器站点数据

如官方文档描述的一样:

> 一旦你输入了正确的密码, 它将会被存储在本地浏览器的 localStorage中. 按个按钮, 密码将会被清空.

通用做法是: 站点页面上点击地址栏左侧锁形图标 → 站点设置/权限 → 清除站点数据.

### 高级设置

#### 文章信息头中可用的高级设置

```yml
---
title: Hello World
tags:
- 作为日记加密
date: 2016-03-30 21:12:21
password: mikemessi
abstract: 有东西被加密了, 请输入密码查看.
message: 您好, 这里需要密码.
theme: xray
wrong_pass_message: 抱歉, 这个密码看着不太对, 请再试试.
wrong_hash_message: 抱歉, 这个文章不能被校验, 不过您还是能看看解密后的内容.
---
```

#### 配置通过标签加密

在 `_config.yml` 中可以加入以下字段:

```yaml
# Security
encrypt: # hexo-blog-encrypt
  abstract: 有东西被加密了, 请输入密码查看.
  message: 您好, 这里需要密码.
  tags:
  - {name: tagNameA, password: 密码A}
  - {name: tagNameB, password: 密码B}
  theme: xray
  wrong_pass_message: 抱歉, 这个密码看着不太对, 请再试试.
  wrong_hash_message: 抱歉, 这个文章不能被校验, 不过您还是能看看解密后的内容.
```

然后在需要加密的文件的信息头中添加对应标签, 该文章即被加密.

文章信息头中的配置, 优先级更高.

#### 可用的主题

+ [default](https://mhexo.github.io/2020/12/23/Theme-Test-Default/)
+ [blink](https://mhexo.github.io/2020/12/23/Theme-Test-Blink/)
+ [shrink](https://mhexo.github.io/2020/12/23/Theme-Test-Shrink/)
+ [flip](https://mhexo.github.io/2020/12/23/Theme-Test-Flip/)
+ [up](https://mhexo.github.io/2020/12/23/Theme-Test-Up/)
+ [surge](https://mhexo.github.io/2020/12/23/Theme-Test-Surge/)
+ [wave](https://mhexo.github.io/2020/12/23/Theme-Test-Wave/)
+ [xray](https://mhexo.github.io/2020/12/23/Theme-Test-Xray/)

## 另外

Hexo 设计的目的是公开博客, 包括所有插件也是如此. 不建议在 Hexo 服务器上写 "密码本" 或 "日记" 等需要加密的内容. 我使用的过程中就遇到了如下问题:

一个评论区插件, [Gitalk](https://gitalk.github.io)需要连接到 GitHub 仓库, 由于我无法将含有文档的仓库本身公开, 因此不得不新增实体, 创建一个空仓库专门用于存储评论.

一个搜索插件, [hexo-generator-searchdb](https://github.com/next-theme/hexo-generator-searchdb) 无法更加精确地划分搜索范围, 如果配置它能搜索到 page, 它将能搜索到所有 page, 包括加密的 page. 这意味着, 访客无需查看文章, 通过关键字就能间接看到隐藏文章.

如果某个东西这么值得加密, 也许用不到 Hexo 的额外管理和界面渲染, 直接放在服务器某个路径上, 通过纯 html 访问, 也能接受, 不是吗?
