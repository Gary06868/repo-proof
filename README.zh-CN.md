# RepoProof

**Make your README true. 让 README 真的可运行。**

RepoProof 是一个开源 Agent Skill 和确定性辅助工具，用来证明一个仓库能否从全新 clone 开始，严格按照 README 完成安装、运行、测试和演示。

它不是 README 生成器，也不是 CI 包装器。它把 README 当成面向新用户的契约，并输出可审查的证据报告。

## 适合谁

RepoProof 适合需要在发布前确认 README 真实可用的开发者和维护者：

- 准备公开 GitHub 仓库的个人开发者。
- 开源项目维护者。
- 使用 AI 或本地快速开发后准备发布项目的人。
- npm / PyPI 包作者。
- 想在 PR 或 release 前重复验证首次安装流程的团队。

它尤其适合这种情况：项目在你的机器上能跑，但你不确定一个新用户只看 README 是否也能跑通。

## 安装

如果你的环境支持 `gh skill`：

```sh
gh skill install Gary06868/repo-proof repo-proof@v0.1.0
```

手动安装：

```sh
mkdir -p .agents/skills
git clone https://github.com/Gary06868/repo-proof .agents/skills/repo-proof
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

## RepoProof 会检查什么

- README 中的 install、test、run、demo 和打包命令。
- README、lockfile 和 `packageManager` 之间的包管理器漂移。
- README 与 `pyproject.toml` 之间的 Python 版本漂移。
- 缺失的 `.env.example`。
- `curl | bash`、安装生命周期脚本、破坏性命令等危险入口。
- README 命令引用但仓库中不存在的文件。
- npm 发布包中漏掉构建产物。
- 本地 Web demo 启动后不可访问。
- Windows 不兼容脚本。

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
