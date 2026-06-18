# RepoProof Workflow

RepoProof has three modes:

- `audit`: static evidence only. It discovers README promises, package metadata, scripts, env requirements, dangerous commands, and packaging drift.
- `prove`: explicit execution mode. It creates a cleanroom copy, runs visible README commands, records command evidence, and checks local web URLs when present.
- `fix`: patch mode. It generates minimal diffs for documentation and configuration drift. It does not commit or push.

Every result must be supported by `repoproof-report.json`. A passing report means the supported workflow passed under the recorded constraints; it does not prove the repository is safe or correct in all environments.
