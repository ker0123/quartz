---
title: rust 学习笔记 - 写一个 doip 通讯器
date: 2026-10-12
tags:
  - rust
  - doip
---

## 背景

接触 rust 已经两年了, 始终没学出什么名堂来. 原因大概是: 接触 rust 的时间正好是 AI 或者说语言大模型(LLM)爆发的时候, 我的大部分代码都是在 AI 一定程度的辅助下写的, 这会导致实际上学习效果很差.

这篇文章很好地总结了我遇到的这个现象: [Vibe Coding，是怎么「玩废」程序员的？](https://mp.weixin.qq.com/s/5LP9E6A__gsJvuNS1QGonw). 短一点可以看 [rust 语言圣经的转载](https://beatai.org/ai-insights/vibe-coding).

前一段时间开始, 还在尝试 用 rust 开发一个 tui 软件, 就是这篇文章 [rust 学习笔记: 开发一个 TUI 应用](learn-rust-with-tui). 其中内容大部分都是一边做, 遇到问题了问 AI, AI 给我解答了的同时记录到文章里. 最终结果就是, 充满 AI 味道的遣词造句, 让我自己也不想去看第二遍. 学习效果依然不好.

再前一段时间, 我有完全不用 AI 学过一段, 写成了这篇文章 ---- [rust 学习笔记](note-rust). 后面回顾的时候, 看着还挺舒服的, 除了吐槽自己当时太菜以外.

所以我决定之后学东西的时候, 虽然可以用 AI 辅助, 但当 AI 提到了某个我不清楚的点之后, 我一点要知道这一块的知识体系都是哪来的, 然后去**看原文学习**. 然后最重要的: **自己手写代码, 不复制或者照抄它的.**

前面这一大堆背景, 都和项目无关. 与项目有关的嘛...

...现在的工作与车辆诊断有关, doip 是其中一个很重要的协议. 公司给的那套环境太垃了, 我想平时测试的时候用自己写的工具算了, 估计能排除一大堆平台的, 或者设备的前置问题.

## 注意

"写一个 doip 通讯器" 不是核心目的. 核心目的是过程中遇到了什么知识点, 然后我会去寻找整个相关知识体系. 用这种 "触发式" 的路径去接触新知识.

## 正文

### rust 项目结构

我这个项目, 生成目标应该是两个软件, 一个 client, 一个是 server. 这需要我整个项目生成两个可执行文件. 问了 AI 怎么处理, 它告诉我要在 src 文件夹下创建一个 `bin/` 文件夹, 然后在里面写 `server.rs` 和 `client.rs`. 联想到 cargo 对源文件还有其他的特殊命名处理, 例如写 `lib.rs` 的话, 项目会以此为根生成一个库作为目标, 写 `main.rs` 的话就是与项目同名的可执行程序. 那么是否同理, 写 `bin/xx.rs` 就是以此文件为根, 生成名为 xx 的可执行程序?

这些特征(trait)都是从 cargo 来的, 貌似是默认有这么一套规则, 如果个人有额外要求的话可以进一步手动设置. 我需要找到原文并学习.

经查询, 这涉及到 cargo 的 **对象自动发现** 功能. 可以参考 [rust 圣经对其的描述](https://beatai.org/rust-course/cargo/reference/cargo-target).

以下内容转载自 rust 圣经的章节 [标准的 package 目录结构](https://beatai.org/rust-course/cargo/guide/package-layout)

一个标准的 Package 目录结构如下

```shell
.
├── Cargo.lock
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── main.rs
│   └── bin/
│       ├── named-executable.rs
│       ├── another-executable.rs
│       └── multi-file-executable/
│           ├── main.rs
│           └── some_module.rs
├── benches/
│   ├── large-input.rs
│   └── multi-file-bench/
│       ├── main.rs
│       └── bench_module.rs
├── examples/
│   ├── simple.rs
│   └── multi-file-example/
│       ├── main.rs
│       └── ex_module.rs
└── tests/
    ├── some-integration-tests.rs
    └── multi-file-test/
        ├── main.rs
        └── test_module.rs
```

这也是 Cargo 推荐的目录结构, 解释如下:

- Cargo.toml 和 Cargo.lock 保存在 package 根目录下
- 源代码放在 src 目录下
- 默认的 lib 包根是 src/lib.rs
- 默认的二进制包根是 src/main.rs
- 其它二进制包根放在 src/bin/ 目录下
- 基准测试 benchmark 放在 benches 目录下
- 示例代码放在 examples 目录下
- 集成测试代码放在 tests 目录下

### crate

注意不是 create, crate 直译过来是 "箱", 可以想象成板条箱, 纸箱这种感觉. crate 是一个独立的 **可编译单元**. 而一个 rust 项目的可编译单元, 它就是名为 crate 的 crate.

一个可编译单元一般对应了一棵 **模块树**. 例如一个有 `src/lib.rs` 文件的, 名为 `doip-comm` 的项目, 它的模块树可能长这样:

```shell
crate
  |- doip-comm
    |- writer
    |- reader
```

换句话说, 如果我想在 `src/bin/server.rs` 里面用到我写在 `src/lib.rs` 的内容, 我只需引入这棵模块树 ---- 在开头写上 `use crate::doip-comm`.

### 所有权和传参

rust 的所有权机制会导致其他语言中简简单单的调用函数和传递参数的写法, 变得艰难. 例如:

```rust
let local_value = 0;
some_func(local_value);
println!("{}", local_value);

fn some_func(value: int32) {
    value = value + 1;
}
```

第二行会把 local_value 的所有权给出去, 导致第三行无法取用, 编译阶段即失败.

因此, 如果一个函数只需要读, 不需要改传入的参数时, 其在定义时就应该写成传入引用. 然后, 在调用的时候, 我们可以用一个引用符号在一行内快捷将其转为引用并传出.

```rust
fn some_func(&value: int32) {
    println!("value = {}", value);
}
```

如果这个函数需要替别人处理这个值的话, 就写成 `&mut type`.

```rust
pub fn some_func(value: &mut int32) {
    *value = *value + 1;
}
```

不过一般没人这么写, 调用一个不知道会对你的传入做什么的函数还是太危险了. 大家写的函数一般只需要你传入不可变应用, 在里面处理完之后给你返回一份处理结果, 可能是处理成功的新实例, 可能是错误报告. 你收到之后自己决定要不要用, 怎么用.

```rust
let local_value = 0;
let local_value = some_func(&local_value);
println!("{}", local_value);

fn some_func(value: &int32) {
    value + 1
}
```

### 依赖的依赖, 不是我的依赖

这是 rust 特意设计的. 你并不能直接使用依赖包的依赖包, 必须重新在 cargo.toml 里面引入, 然后用 use 引入到代码里.

对比 c++. 它的大部分项目会需要你提供一个总的依赖列表, 例如经典的头文件目录, 库目录. 且编译阶段并不会解决依赖问题, 而是在链接阶段再在给定路径中查找具体内容.

而 rust 在编译前就解决了依赖问题.

发现这一点主要是因为这个 doip-comm 项目用到的 `simple-doip` 依赖, 它使用特征(trait)的写法, 给出一堆函数声明, 让我们自行填写. 实现了该特征的类就能当作 server 或者 celient 的处理器.

在写的过程中, 我注意到 `impl` 这一段前面有个 `#[async_trait]` 的特征, 不引入的话, impl 内部所有以 `sync` 为前缀的函数都会报错. 一看就是多线程同步相关的东西, 现在还不想去深究.
