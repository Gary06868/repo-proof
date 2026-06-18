# RepoProof

**Make your README true. 让 README 真的可运行。**

RepoProof 是一个开源 Agent Skill 和确定性辅助工具，用来证明一个仓库能否从全新 clone 开始，严格按照 README 完成安装、运行、测试和演示。

它不是 README 生成器，也不是 CI 包装器。它把 README 当成面向新用户的契约，并输出证据报告。

## 安装

如果你的环境支持 `gh skill`：

```sh
gh skill install <owner>/repo-proof repo-proof@v0.1.0
```

手动安装：

```sh
mkdir -p .agents/skills
git clone https://github.com/<owner>/repo-proof .agents/skills/repo-proof
```

兼容路径包括 `.agents/skills/repo-proof`、`~/.agents/skills/repo-proof`、`.codex/skills/repo-proof`、`.claude/skills/repo-proof`、`.cursor/skills/repo-proof`、`.github/skills/repo-proof` 和 `.gemini/skills/repo-proof`。

## 首次运行

```sh
pnpm install
pnpm repoproof audit fixtures/node/wrong-package-manager --json --output .tmp/demo
```

查看 `.tmp/demo/repoproof-report.md`。

如果明确允许执行 README 中的命令：

```sh
pnpm repoproof prove fixtures/node/good-cli --allow-exec --json --output .tmp/proof
```

## 安全边界

RepoProof 默认是 `audit-only`，不会执行仓库代码。

`prove --allow-exec` 会在 best-effort cleanroom 副本中运行 README 命令，并限制环境变量、超时、输出大小和报告敏感信息。它不是强沙箱。没有真正的容器、虚拟机或系统级 sandbox 时，不能承诺任意陌生仓库完全安全。

RepoProof 不会 publish、deploy、push、merge，也不会读取用户秘密。

## 输出

- `repoproof-report.md`
- `repoproof-report.json`
- `repoproof-fixes.patch`
- `repoproof-action.yml`

英文 README 是 canonical 文档；本中文说明与 v0.1.0 计划同步。
