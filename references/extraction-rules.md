# README Extraction Rules

RepoProof extracts shell-like fenced code blocks from `README.md`. Supported fences include `sh`, `shell`, `bash`, `zsh`, `powershell`, `ps1`, `pwsh`, `console`, `terminal`, and blank fences.

Each extracted command is classified as:

- `install`
- `test`
- `run`
- `package`
- `demo`

Narrative instructions are used as supporting evidence but not executed unless they appear as commands. If the README references a local demo URL, prove mode checks whether the URL becomes reachable.
