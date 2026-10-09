---
title: rust 学习笔记
date: 2025-08-22 12:00:00
tags:
  - rust
  - develop
---

个人学习 Rust 语言的记录. 比较基础, 属于一年之后再看会嘲笑自己的程度.

## 题记: 学习历程

### VS Code 调试程序时遇到的麻烦

LLDB 插件并不完全适配 Windows 平台上的 cargo + iced 项目, 直接用默认方式调试会导致程序无法运行. 而在外部终端直接使用 `cargo run` 则屁事没有.

好像可以手动使用外部终端运行 `cargo run`, 再在 VS Code 中将调试程序依附到当前执行程序上. 不失为一种方法. ~~另外一条路是: 再去研究研究调试器, 自己配置调试器.~~ 尝试了, 发现 CodeLLDB 帮我们做了大量事情, 同时也限定了只用自己的调试器. 自己配之后更麻烦, 暂时凑活用吧.

最后还是得手写调试配置, 装这么多插件只为了写代码方便.

### GUI 程序编写 - Iced

找到了个 Rust 上比较流行的 GUI 软件编写包, 其设计理念非常优美. 刚好自己有做 GUI 界面的需求, 因此开始尝试.

官方有个项目示例 "Todo". 这个项目包括元素适配窗口尺寸, 包括元素的增删改, 还有图片和字体的外部导入. 值得学习.

### 第一个正式项目 - Use-CLI-like-GUI

本人使用 Rust 语言配合 iced 开源库编写的第一个有实际用途的项目, 项目地址在[这里](https://github.com/ker0123/use-cli-like-gui).

主要功能是读取 `toml` 文件, 实时生成一套选择参数的 GUI, 用户选好之后点执行, 程序就会帮助用户组合命令并执行. 另外, 程序还能实时保存当前选择的参数和输入的值.

### 为 UCG 加入多线程

使用 Use-CLI-like-GUI 项目软件时, 调用命令为阻塞式的进行, 这导致在执行用时较长的命令(比如 ffmpeg 编码视频), 软件界面会卡住相同的时间. 另外, 软件无法实时获取命令行工具输出到终端的内容, 这导致黑窗口无法割舍, 更别提隐藏终端, 将命令行输出显示在软件 UI 中.

因此接下来为 UCG 加入多线程. 学习的内容写在[知识点]章节.

---

## 所有权和借用

是 Rust 的基础, 不多说. 只提需要记住的几点:

- 传给函数和函数返回, 都会转移所有权
- 同时只能存在一个可变借用或多个不可变借用(不可以同时存在可变和不可变借用!)
- 借用必须有效(比如在函数中新建的变量, 作为返回值的话, 返回后会失效, 因此会报错)

## 部分流程控制语句

### if { ... } else { ... }

这其中的代码块为 **表达式**. 因此可以不在最后一句写分号, 达到类似三目运算法 `... ? ... : ...` 的效果. 注意, 两个表达式的返回值类型要相同.

### match

更强大的 `switch()`. 看一个例子就什么都明白了.

```rust
enum Direction {
    East,
    West,
    North,
    South,
}

fn main() {
    let dire = Direction::South;
    match dire {
        Direction::East => println!("East"),
        Direction::North | Direction::South => {
            println!("South or North");
        },
        _ => println!("West"),
    };
}
```

### let 和 if let

虽然两个是独立的命令, 后者不是 `if` 和 `let` 的组合, 不过在语义上, 视为组合也很便于理解:

```rust
enum Ti {
    VER_3050,
    VER_4060,
}

// 一个可能返回空的函数
fn do_something() -> Option<Ti> {
    ...
}

// 如何只处理不为空的情况
fn main() {
    let ret = do_something(); // ret: Option<T>
    if ret = Some(i) {
        ...
    }
}

```

## 特征, 派生属性

`#[derive(xxx)]` 这种写法在 Rust 中被称为派生属性(Derive Attribute). 派生属性允许您为自定义的数据类型(如结构体 struct 和枚举 enum)自动实现一些常见的 trait(特征). 这些 trait 提供了默认的行为, 使得代码更简洁, 且减少了重复工作.

例如:

```rust
// 提供默认的 default() 方法创建 Counter 实例, 会使用所有字段的默认值.
#[derive(Default)]
struct Counter {
    value: i32,
}
let counter = Counter::default();

// 提供默认的 println() 方法输出结构体内容到终端
#[derive(Debug)]
struct Counter {
    value: i32,
}
println!("{:?}", counter);

// 提供默认的 clone() 方法来克隆对象, 写上 Copy 代表此次拷贝为 "深拷贝".
#[derive(Clone, Copy)]
struct Counter {
    value: i32,
}
let counter_copy = counter;

```

另见: [所有标准库中存在的派生属性](https://course.rs/appendix/derive.html).

## 多线程

### 使用多线程

使用 `thread::spawn` 创建线程, 传入线程函数(可以配合闭包).

使用线程的 `join()` 方法等待线程结束.

配合闭包, 使用 `move` 关键字将当前作用域的变量所有权交给线程. 在闭包中直接调用当前作用域的变量是危险的, 因为无法判断静态线程的结束时间.

**要考虑线程如何结束**, 特别是单子线程 A 又创建了子线程 A-1 的时候, 如果只记得处理 A 的结束, A-1 可能会失去控制.

### 消息通道

使用标准库 `std::sync::mpsc` 创建通道, 其中 `mpsc` 就是 *multiple producer, single consumer* 的缩写.

使用闭包和 `move` 关键字将发送者变量或接受者变量移交给子线程.

使用 `send()`, `recv()` 发送和阻塞式地接收, 使用 `try_recv()` 非阻塞式地接收.

### 多线程中的所有权

多线程中, 我们使用通道来传输数据. 和函数一样, 将变量传入通道, 将同时默认移交所有权(除非变量类型实现了 `copy` 特征).

通道分 2 种, 异步通道: 发送者发完可以直接不管离开; 同步通道: 发送者发完数据后阻塞, 直到数据被取走; 还有第三种更加优秀的变体 ---- 带缓冲值的同步通道, 你可以设定最大缓冲值, 当通道中消息数量小于缓冲值时, 相当于异步通道, 当通道中消息数量等于缓冲值时, 发送者将被阻塞. 这避免了内存被撑爆.

```rust
// 创建单发送者, 单接收者的异步通道
let (tx_0, rx_0) = mpsc::channel();
// 创建单发送者, 单接受者的同步通道
let (tx_1, rx_1) = mpsc::sync_channel(1);
// 创建多发送者, 单接受者的缓冲的同步通道
let (tx_2, rx_2) = mpsc::sync_channel(3); // 通道中最多 3 条消息
let tx_2_1 = tx2.clone(); // 复制一份发送者
// 将发送者, 接收者所有权交付给线程
let p0 = thread::spawn(move || {tx_0.send("p0").unwarp();});
let p1 = thread::spawn(move || {tx_0.send("p1").unwarp();});
let p2_0 = thread::spawn(move || {tx_0.send("p2-0").unwarp();});
let p2_1 = thread::spawn(move || {tx_0.send("p2-1").unwarp();});
// 接收者接收信息
let rx_2_rcv = rx_2.recv().unwarp();
```

#### 技巧: 通道传多种类型信息

由于发送者和接受者只能定义同一种类型, 通道的信息交流有些不方便. 最简洁的解决方案就是使该通道发送同一种枚举类型, 在枚举类型中定义所需的不同类型数据.

```rust
enum Message {
    Id(i32),
    Name(String),
}

let (tx, rx): (Sender<Message>, Reciver<Message>) = mpsc::channel;
```

### 通过内存共享(智能指针), 互斥锁来构建多线程

不使用信号, 要完全做到线程安全, 挺麻烦的. 暂时不仔细学习.

## 其他小知识点

### 闭包

可以类比于 C++ 的 lambda 表达式, 又可以称为不具名函数. 声明格式为 `|参数列表| {表达式}`.

它有一些很有用的特性, 比如: 我们可以将其存为变量:

```rust
let name_i = names[i]
let name_j = names[j];
let name_k = names[k];
let match_name = | name: String | -> bool {name == name_i};
match(match_name(name_j));
match(match_name(name_k));
```

### 包和模块

在 `Cargo.toml` 里面写的是 `包(Package)`, 在代码开头(一般是这个位置) 里面写的 `use xxx::xxx` 是模块, 也有可能是函数.

引入模块后, 可以使用模块中的所有函数, 但必须写成 `lced::run(...)` 这种形式; 引入函数后, 可以直接使用函数: `run(...)`.

可以用 `use lced::widget::{Column, button, column}` 代替  
```rust
use lced::widget::Column;
use lced::widget::button;
use lced::widget::column;
// 大写开头的是函数, 小写开头是模块
```

另见 [Rust 语言圣经(Rust Course)](https://course.rs/basic/crate-module/intro.html) 中对该部分的讲解.

### 变量遮蔽

在 Rust 中, 允许在同一个作用域内用 let 重新定义(shadow)变量, 并且可以改变其类型. 这叫做变量遮蔽(shadowing).

常见用以对参数类型进行转换与解包时:

```rust
pub fn new(max_cache: Option<usize>) -> Self {
    let max_cache = max_cache.unwrap_or(1);
    // 这里的 max_cache 已经是 usize 类型
    ...
}
```
