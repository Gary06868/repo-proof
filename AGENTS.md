# RepoProof Agent Notes

- Treat this repository as both an open Agent Skill and a deterministic Node toolkit.
- Default to audit-only behavior. Do not execute repository code unless `--allow-exec` is explicit.
- Keep `SKILL.md` short and move detailed instructions into `references/`.
- Keep deterministic behavior in `scripts/`; do not rely on model judgment for safety-critical decisions.
- Run `pnpm verify` before claiming completion.
- Do not publish, deploy, push, merge, or read secrets from inspected repositories.
