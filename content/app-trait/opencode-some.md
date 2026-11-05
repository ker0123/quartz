---
title: opencode 的一些使用技巧
date: 2026-11-03
tag:
  - opencode
  - sync
---

在使用 AI 辅助编程这一块, 我基本上 all in 了 opencode. 使用过程中, 了解了很多让 opencode 更好用的技巧.

<!--more-->

## opencode v2 !

在 opencode 1.x.x 版本, 每开一个 TUI session, opencode 都会新创建一个 opencode 进程和一个 bun 后端. 这首先导致了每次启动都比较慢, 其次导致了同时开多个 session 时, 内存占用会很大.

opencode 2.x.x 版本则重构了服务框架. 现在第一次启动 opencode, 会同时创建一个统一的 opencode 服务, 默认开放在本机 4096 端口, 默认能直接在浏览器打开 webUI. 同时后续所有 session 都会复用这个服务, 重新创建的只有前端. 解决了上面说的两个问题: 开多个 session 的时候, 启动更快, 内存占用更少.

因此我第一时间转用 opencode v2. 在 scoop 上 `add bucket versions` 然后 `install opencode2` 就能下载到了.

可惜, `opencode acp` 不会连接到这个统一的后台服务, 它仍然会新开线程. 如果调用 acp 的软件处理不好的话, opencode 仍然会开多个线程造成资源浪费 (例如写这篇文章时, zed 就会造成这种资源浪费).

见 [官方 v2 文档的 acp 章节](https://opencode.ai/v2/docs/cli/acp/)

> `opencode acp` starts a private OpenCode server for its own use. It doesn’t connect to the shared background service, and it doesn’t open a network port for ACP. One process can serve many ACP sessions. It exits when the client closes stdin.

opencode v2 还进行了很多重构, 现在配置文件要按新的规则写, 各个地方的 UI 也大变样了(这一点收到很多抨击). 配置文件的话其实还好, 我只觉得结构更优美了; UI 的话, 我讨厌它们那些标签页, 特别是在 TUI 的标签页. 作为一个终端内部的, 浏览器内部的软件, 再加一层标签页, 先不说美观和使用习惯, 光是切换标签页的键位就有很多冲突.

TUI 的话, 要关闭标签页, 可以在配置文件夹(`~/.config/opencode/`)里新建 `cli.json`, 然后写入以下内容. 重启或者使用 `/reload` 命令, 标签页就不见了.

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "tabs": {
    "mode": "off"
  }
}
```

## golbal skills

可以用 `npx skills` 命令去全局安装 agents 用的技能 (不懂为啥 npx 会内置这种命令, 但是挺好用的).

整个过程与 opencode 无关, skills 保存在 `~/agents` 这种通用目录里, opencode 只是 "凑巧" 读到.

这件事让我意识到了, 其实 opencode 有很强的拓展性, 我应该多了解一些 node 模块, opencode 插件之类的东西.

## 长期记忆

opencode 在每个 session 之间, 会忘掉很多事. 我需要让它有基本的记忆能力.

### 接入 mem0 - 不太行

之前在用 astrbot 的时候, 遇到了一个插件, 可以连接 mem0 提供记忆功能. 为此我又专门自托管了开源版的 mem0, 再对插件大修让其适配. 现在, 至少 mem0 那边已经投入使用且没什么问题了.

又看到 [mem0 官方对 opencode 有支持](https://docs.mem0.ai/integrations/opencode), 只需要安装一个 node 模块...

```sh
opencode plugin @mem0/opencode-plugin
```

对于 opencode v1 + mem0 官方服务来说, 应该是能用的. 不过因为我已经全盘用上 v2 加自托管 mem0 了, 所以没试.

对于 opencode v2, 安装命令稍有变化

```sh
opencode plugin add @mem0/opencode-plugin
```

但即使安装了, 进入 opencode 也会报错:

> "Failed to check Server plugin "@mem0/opencode-plugin": Plugin must export a default definition with an id and an effect or setup function."

mem0 官方插件, 至少在我写这篇文章, 0.4.1 版本的时候, 完全是根据 v1 的 API 写的. 放到 V2 上面, 插件没法用.

### 第三方插件 - 选用 opencode-mem

前面说的 mem0, 虽然插件不能用了, 但是它还有 MCP 呀? 为什么不用 MCP?

因为 MCP 和插件比起来有个局限: MCP 只能在上下文提供一点提示词, 等着 agent 看到它, 在做事情的时候想起来, 再 **主动调用**. 问题就出在这, 除非你在对话中主动提起, 否则大部分时候, agent 不会去 "主动回忆".

注入记忆这种事还得是插件来做, hook 一下流程, 不征得 agent 同意, 让它先想起相关的事情, 再做回复.

与 AI 讨论了一番, 最后选择的是 **opencode-mem** 这个插件. 它的特点就是用户非常多, 维护非常活跃. 在别的插件下载量还是 3 位数的时候, 它已经是以 k 结尾了.

当然不能光看下载量, 实际上它的特点是: 使用了本地的轻量嵌入模型 ONNX. 毫秒级的响应速度, 比 mem0 动不动 20s 的来回快多了. 占用大概 500-1000 MB. 要是觉得太多, 外接 openai 的 text-embedding-3-small 也是可选的.

使用 `opencode plugin add opencode-mem` 就能立刻安装这个插件, 然后有个硬性的改配置文件需求. 找到插件在配置目录下生成的 `opencode-mem.jsonc`, 里面是所有配置项以及大量注释. 大部分不用动, 主要是 **OpenCode Provider Settings (RECOMMENDED)** 这一段 (毕竟人家都全大写 RECOMMENDED 了), 阅读这一段, 然后加上两行配置选自己用来归纳和搜索记忆的模型:

```json
{
  "opencodeProvider": "deepseek",
  "opencodeModel": "deepseek-flash"
}
```

一般来说直接填 opencode 里面能选用的模型就好, 否则需要额外填 api-key 这些东西.

另一个值得修改的地方, 是保存记忆使用的语言. 默认是 auto, 根据文本内容自动猜测. 实际用着, 发现即使是日常中文对话, 有时会保存为中文, 另外一些时候会保存为英语甚至法语. 有必要重新设置一下. 该配置的位置在文件的 324 行

```json
{
  "autoCaptureLanguage": "zh",
}
```

我个人来说, 希望 opencode 能跨项目记忆. 项目内的记忆还是写在 AGENTS.md 就行. 因此我还会改一行记忆范围的配置

```json
{
  "memory": {
    "defaultScope": "all-projects"
  },
}
```

插件还会创建一个 webUI 服务, 默认在本地的 4747 端口开放(127.0.0.1, 仅本机可访问). 当然, 这些也可以在配置文件里改. 就在 "Web Server Settings" 章节. 除了端口, 你还可以设置局域网开放, 账号密码...

在 webUI 里可以看到生成的记忆内容. 同时. 日志文件保存在 `~\.opencode-mem\opencode-mem.log`. 出了什么问题可以去这看.

总结起来, 就是这些改动:

```diff
--- 默认模板 (default template)
+++ 当前配置 (~/.config/opencode/opencode-mem.jsonc)
@@ -66,14 +66,14 @@
   "webServerEnabled": true,
   
   // Port for web UI server
-  "webServerPort": 4747,
+  "webServerPort": 14747,
   
   // Host address for web UI (use 127.0.0.1 for local only, 0.0.0.0 for network access)
   "webServerHost": "127.0.0.1",
 
   // Optional HTTP Basic Auth for the web UI. Accepts literal, env://, or file:// secrets.
-  // "webServerAuthPassword": "",
-  // "webServerAuthUsername": "",
+  "webServerAuthPassword": "************",
+  "webServerAuthUsername": "Jane",
 
   // Required when webServerHost is not loopback. Protects /api/* with Bearer / X-Opencode-Mem-Token.
   // "webServerApiToken": "env://OPENCODE_MEM_WEB_TOKEN",
@@ -104,7 +104,7 @@
   // Default scope for memory list/search queries
   // "project" keeps queries within the current project, "all-projects" searches across all project shards
   "memory": {
-    "defaultScope": "project"
+    "defaultScope": "all-projects"
   },
 
   // ============================================
@@ -142,6 +142,8 @@
    // (auto-capture summaries, profile learning; default 90000, clamped to 10000..600000;
    // invalid values fall back to the default; numeric strings are coerced):
    // "opencodeTimeoutMs": 180000,
+   "opencodeProvider": "deepseek",
+   "opencodeModel": "deepseek-flash",
 
    // ============================================
    // Auto-Capture Settings
@@ -319,7 +321,7 @@
 
   // Language for auto-capture summaries and user profile learning (default: "auto" for auto-detection)
   // Options: "auto", "en", "id", "zh", "ja", "es", "fr", "de", "ru", "pt", "ar", "ko"
-  // "autoCaptureLanguage": "auto",
+  "autoCaptureLanguage": "zh",
 
   // ============================================
   // Toast Notifications
```
