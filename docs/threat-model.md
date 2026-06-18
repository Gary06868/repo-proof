# RepoProof Threat Model

RepoProof assumes inspected repositories may be buggy or malicious.

Threats:

- Install scripts reading credentials.
- README commands that pipe remote shell scripts.
- Git hooks, filters, submodules, LFS, and custom helpers.
- Tests that start background processes.
- Reports leaking tokens, home paths, or private URLs.

Controls:

- Audit-only default.
- Explicit prove execution.
- Cleanroom copy without `.git`.
- Environment allowlist.
- Timeout and output caps.
- Deterministic redaction.
- No publish, deploy, push, or merge behavior.

Residual risk:

- Without a real sandbox, local command execution can still affect the host. Treat prove mode as high risk for unknown repositories.
