# Safety Model

RepoProof executes untrusted project code only when the user explicitly chooses prove mode. Without a real container, VM, or OS sandbox, RepoProof provides risk reduction, not strong isolation.

Default controls:

- Work in a temporary cleanroom copy, not the original worktree.
- Do not copy `.git`.
- Do not follow symlinks, junctions, or unusual filesystem entries.
- Build a small allowlist environment.
- Remove known token variables and credential paths from reports.
- Enforce command timeouts and output caps.
- Block obviously dangerous README commands and package scripts.

Never run `publish`, `deploy`, `push`, `merge`, infrastructure apply commands, or arbitrary binary executables as part of v1.
