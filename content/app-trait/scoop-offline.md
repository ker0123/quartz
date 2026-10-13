---
title: 离线安装 scoop, 以及后期更新软件
date: 2026-09-07
tags:
  - scoop
  - offline
---

scoop 是 windows 上一个很干净, 软件源也很多的包管理器. 有时, 我们会想要把它安装在离线的环境, 并且后续可能需要安装新软件, 更新已有软件.

## 首次在离线安装 scoop

> 需要你的电脑至少能够使用 Powershell V1.0, 且能在其上运行 git 命令
>
> 要测试这点很简单: 右键 win 徽标, 选择 [终端] 或 [Powershell], 输入 `git --version`. 出现版本号说明没问题.

由于 scoop 安装方式相对干净, 本身不会在自身安装位置之外产生任何文件, 因此, 你甚至可以把外网安装好的 scoop 整个目录迁移到内网.

记得补上环境变量:  
  - 在用户环境变量中, 创建新键 `SCOOP`. 指向 scoop 个人应用目录. scoop 默认为 `C:\Users\<username>\scoop`.
  - 在用户环境变量的 `PATH` 中, 新增 scoop 安装的软件引用路径, scoop 默认为 `C:\Users\<username>\scoop\shims`
  - 在系统环境变量中, 创建新建 `SCOOP_GLOBAL`. 指向 scoop 全局应用目录. scoop 默认为 `C:\ProgramData\scoop`.
  - 在系统环境变量的 `PATH` 中, 新增 scoop 安装的全局软件引用路径, scoop 默认为 `C:\ProgramData\scoop\shims`.

> 以个人经验, 我建议全部设置为 `C:\scoop` 和 `C:\scoop\shims`.
> 
> 因为我的 windows 电脑只有我一个人在使用, 没必要划分多用户.
> 
> 并且 `User`, `ProgramData` 这些 windows 风格的路径, 在填写某个编译工具的路径, 例如 `C:\User\kerol\scoop\shims\adb`, 例如 `C:\ProgramData\scoop\shims\clang`, 又长又不好看. 如果总是 `C:\scoop\shims\clang`, 看起来会稍微好些.

如果你外网的 scoop 占用太大了, 想试试更干净更优雅的安装方式, 那么你可以使用 *安装脚本 + 预下载仓库* 的方式在内网重新安装.

**前面提到的环境变量最好也提前设置一下**. 不设置也没关系, 安装脚本会引导你设置.

首先, 在外网克隆好 scoop 的仓库:

```sh
# 克隆仓库
git clone https://github.com/ScoopInstaller/Scoop.git
git clone https://github.com/ScoopInstaller/Main.git
# 用 git bundle 打包仓库
git -C ./scoop bundle create main.bundle HEAD master
git -C ./main bundle create extras.bundle HEAD master
```

然后, 在外网下载好官方安装脚本

```sh
irm get.scoop.sh > install.ps1
```

将 `main.bundle`, `extras.bundle`, `install.ps1` 三个文件传入内网电脑任意位置, 例如 C 盘根目录.

然后用任意编辑器打开 `install.ps1`, 修改靠近末尾的这部分内容

```diff
- $SCOOP_PACKAGE_GIT_REPO = 'https://github.com/ScoopInstaller/Scoop.git'
- $SCOOP_MAIN_BUCKET_GIT_REPO = 'https://github.com/ScoopInstaller/Main.git'
+ $SCOOP_PACKAGE_GIT_REPO = 'C:\scoop.bundle'
+ $SCOOP_MAIN_BUCKET_GIT_REPO = 'C:\main.bundle'
```

> 这段脚本, 将安装时克隆仓库的路径, 从一个网络路径改为了刚才打好的包的路径. 为什么这也能行呢?
> 
> 如果你有仔细端详这个安装脚本, 就会发现全程只出现过这几个链接:
> 
> ```sh
> # TODO: Use a specific version of Scoop and the main bucket
> $SCOOP_PACKAGE_REPO = 'https://github.com/ScoopInstaller/Scoop/archive/master.zip'
> $SCOOP_MAIN_BUCKET_REPO = 'https://github.com/ScoopInstaller/Main/archive/master.zip'
> 
> $SCOOP_PACKAGE_GIT_REPO = 'https://github.com/ScoopInstaller/Scoop.git'
> $SCOOP_MAIN_BUCKET_GIT_REPO = 'https://github.com/ScoopInstaller/Main.git'
> ```
> 
> 顺藤摸瓜找到用到链接的地方, 发现联网下载发生在安装之前: 如果检测到 git, 那么就尝试通过克隆 git 仓库的方式安装, 否则尝试通过下载压缩包的方式安装.
> 
> 而 `git clone` 命令, 对于 url 和 bundle 的行为, 刚好是完全一致的. 把 url 换成 bundle, 最终的结果几乎没有差别. 由此, 将该 url 更改为下载好的 bundle, 我们就能避免联网, 且按正常流程完成 clone 仓库, 继续安装.
> 

最后, 打开一个管理员 Powershell 窗口, 获取执行 ps1 脚本的权限, 执行修改后的安装脚本.

```sh
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
./install.ps1
```

中间有一些参数需要你另行设置, 如果已经设置过环境变量, 现在就会少设置一些. 安装脚本会帮你做一些配置方面的工作, 包括修改环境变量, 创建 shims 文件夹. 一切就绪之后, 你的终端环境就能运行 scoop 了, 且同时预装了 main 软件源仓库.

## 离线安装更多软件源

如果需要安装更多软件源仓库, 例如 `extras`, `versions`. 你需要手动复制仓库到 `scoop/buckets` 下, 与 `main` 仓库平级.

可以从外网整个复制, 稍微优雅一点, 就如同最开始 main 仓库的来源一样:

```sh
# 克隆仓库
git clone https://github.com/ScoopInstaller/Extras.git
git clone https://github.com/ScoopInstaller/Versions.git
# 用 git bundle 打包仓库
git -C ./extras bundle create extras.bundle HEAD master
git -C ./versions bundle create versions.bundle HEAD master
```

迁移 `extras.bundle` 和 `version.bundle` 到内网之后

```sh
# 解压仓库
git clone C:\extras.bundle C:\scoop\buckets\extras
git clone C:\versions.bundle C:\scoop\buckets\versions
```

最好, 记得清理放在根目录的各种 `*.bundle` 文件, 和前面章节的 `install.ps1`.

## 后期安装新软件/更新软件

scoop 安装或更新软件的逻辑其实很简单:

1. 尝试更新软件源
2. 从软件源仓库中记载的地址下载软件, 如果已经下载好了就跳过下载
3. 根据软件源仓库记载的安装方法进行安装

因此我们只需要:

1. 跳过软件源更新
2. 准备好安装包
3. 保证软件源仓库有该安装包的安装方式记录

核心思路是**按需**准备两件东西:

1. 软件源仓库 (buckets)
2. 软件安装包 (cache)

然后内网就可以配合一些参数, 正常地使用 `install` 和 `update` 命令, 安装和更新软件.

### 只需安装软件, 不在乎版本

你可以在已经安装好 scoop 的内网电脑上, 执行 `scoop search <软件名>`, 记住这个版本号.

然后在外网电脑上, 执行 `scoop download <软件名>@<版本号>`

下一步, 找到外网电脑的 `path/to/scoop/cache/<软件名>@<版本号>.<zip/7z>`. 将这个文件复制到内网对应的位置. `path/to/scoop` 一般都是 `C:/Users/<用户名>/scoop`.

最后, 在内网执行 `scoop install -u <软件名>@<版本号>`, 正常安装软件.

### 版本过时, 需要安装新版本

首先, 你需要在网络畅通的电脑上, 使用 `scoop update` 更新软件源. 再用 `scoop download <软件名>`, 下载软件最新版本安装包.

此时将位于 `cache` 的安装包直接防盗内网电脑安装的话, 会失败. 还记得我们开头提到的 ---- 我们需要**保证软件源仓库有该安装包的安装方式记录**. 此时, 内网过旧的软件源仓库没有这个新版本安装包的安装方式记录(即使两个版本安装方式一样, scoop 可不管这么多, 它用版本号找不到记录就算对不上), 我们需要更新内网 scoop 的软件源仓库.

软件源仓库位于 `path/to/scoop/buckets`, 下面每个文件夹就算一个软件源仓库. 我们同步外网与内网的这一部分就可以.

值得注意的是: 由于是 git 仓库, 请**不要直接覆盖**, git 仓库内容可能会乱. 先删除旧的仓库, 再复制新的仓库.

仓库覆盖好之后, 再次运行 `scoop install -u <软件名>@<版本号>`, 就能正常安装最新版本了.

### 解决 buckets 下的仓库过大的问题

> 这个章节的步骤是可选的

考虑到 `/buckets` 下面都是 git 仓库, 在长期使用的情况下, 体积会有膨胀. 我自己常用的几个软件源, 几个月不见已经有 200MB 了.

这对迁移数据或多或少有影响. 不过, 可以采取点办法减小 git 仓库的体积.

1. 重新添加软件源仓库是个简单有效的方法:
  ```sh
  # 移除仓库
  scoop buckets rm main
  scoop buckets rm extras
  # 添加仓库
  scoop buckets add main
  scoop buckets add extras
  ```
2. 稍微会一些 git, 可以尝试使用 `git bundle` 的方式直接打包成 git 专用的格式, 后续再解压:  
  ```sh
  # 找到 buckets 目录
  cd C:/Users/user_online/scoop/buckets
  # 用 git bundle 打包仓库
  git -C ./main bundle create main.bundle HEAD master
  git -C ./extras bundle create extras.bundle HEAD master
  # 后续使用 git clone 解包
  git -C ./main clone main.bundle main
  git -C ./extras clone extras.bundle extras
  ```
