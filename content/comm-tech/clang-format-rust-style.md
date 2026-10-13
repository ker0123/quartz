---
title: 用 clang-format 复刻 rustfmt 风格
date: 2025-09-02
tags:
  - clang-format
  - rust
---

VSCode, 即使不安装 Clangd 插件, 也能配置使用 `.clang-format` 来格式化代码. 这说明这种记录代码格式的方式是很通用的.

另外, Rust 作为一门非常现代化的语言, 其默认格式化规则也是做的很赏心悦目. 它抛弃了像是 `m_xxx` 表示成员变量, 滥用大写这种应该被淘汰的风格, 令我非常喜欢. 因此四处搜寻, 找到了一套用 `.clang-format` 来仿照 Rust 格式化风格的配置.

<!--more-->

配置来自:

- [YodaEmbedding/.clang-format](https://gist.github.com/YodaEmbedding/c2c77dc693d11f3734d78489f9a6eea4)
- [julyfun/.clang-format](https://gist.github.com/julyfun/8a739e0529818a4a41bf1762e6859fbf)
- [SJTU-RoboMaster-Team/style-team](https://github.com/SJTU-RoboMaster-Team/style-team)

```yaml
AccessModifierOffset: -4
AlignAfterOpenBracket: BlockIndent
AlignConsecutiveMacros: false
AlignConsecutiveAssignments: false
AlignConsecutiveDeclarations: false
AlignEscapedNewlines: DontAlign
AlignOperands: false
AlignTrailingComments: false
AllowAllArgumentsOnNextLine: false
AllowAllConstructorInitializersOnNextLine: false
AllowAllParametersOfDeclarationOnNextLine: false
AllowShortBlocksOnASingleLine: Always
AllowShortCaseLabelsOnASingleLine: false
AllowShortFunctionsOnASingleLine: Empty
AllowShortIfStatementsOnASingleLine: OnlyFirstIf
AllowShortLambdasOnASingleLine: All
AllowShortLoopsOnASingleLine: false
AlwaysBreakAfterReturnType: None
AlwaysBreakBeforeMultilineStrings: true
AlwaysBreakTemplateDeclarations: Yes
BinPackArguments: false
BinPackParameters: false
BreakBeforeBinaryOperators: NonAssignment
BreakBeforeBraces: Custom
BreakBeforeTernaryOperators: true
BreakConstructorInitializers: AfterColon
BreakInheritanceList: AfterColon
BreakStringLiterals: false
ColumnLimit: 128
CompactNamespaces: false
ConstructorInitializerAllOnOneLineOrOnePerLine: true
ConstructorInitializerIndentWidth: 4
ContinuationIndentWidth: 4
Cpp11BracedListStyle: false
DerivePointerAlignment: false
EmptyLineAfterAccessModifier: Never
EmptyLineBeforeAccessModifier: Always
FixNamespaceComments: true
IncludeBlocks: Regroup
IncludeCategories:
  - Regex:           '^<ext/.*\.h>'
    Priority:        2
    SortPriority:    0
    CaseSensitive:   false
  - Regex:           '^<.*\.h>'
    Priority:        1
    SortPriority:    0
    CaseSensitive:   false
  - Regex:           '^<.*'
    Priority:        2
    SortPriority:    0
    CaseSensitive:   false
  - Regex:           '.*'
    Priority:        3
    SortPriority:    0
    CaseSensitive:   false
IncludeIsMainRegex: '([-_](test|unittest))?$'
IndentCaseLabels: true
IndentPPDirectives: BeforeHash
IndentWidth: 4
IndentWrappedFunctionNames: false
InsertBraces: true
InsertNewlineAtEOF: true
KeepEmptyLinesAtTheStartOfBlocks: false
MaxEmptyLinesToKeep: 1
NamespaceIndentation: Inner
PointerAlignment: Left
ReflowComments: false
RemoveParentheses: ReturnStatement
RemoveSemicolon: true
SeparateDefinitionBlocks: Always
SortIncludes: true
SortUsingDeclarations: true
SpaceAfterCStyleCast: false
SpaceAfterLogicalNot: false
SpaceAfterTemplateKeyword: false
SpaceBeforeAssignmentOperators: true
SpaceBeforeCpp11BracedList: true
SpaceBeforeCtorInitializerColon: false
SpaceBeforeInheritanceColon: false
SpaceBeforeParens: ControlStatements
SpaceBeforeRangeBasedForLoopColon: false
SpaceInEmptyParentheses: false
SpacesBeforeTrailingComments: 1
SpacesInAngles: false
SpacesInCStyleCastParentheses: false
SpacesInContainerLiterals: false
SpacesInParentheses: false
SpacesInSquareBrackets: false
Standard: Cpp11
UseTab: Never
```
