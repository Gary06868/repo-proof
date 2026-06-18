---
name: repo-proof
description: Use this skill when a user needs to prove that a repository README or release instructions work from a fresh clone: audit install/run/test/demo steps, create cleanroom evidence, classify README/script/config/package failures, generate minimal fixes, or add a GitHub Action for README truth verification. Do not use for ordinary README writing, generic code review, broad QA checklists, or tasks that do not require repository-grounded fresh-clone evidence.
---

# RepoProof

Prove the repository from the point of view of a new user. Treat the README as a contract, not a suggestion.

## Default Workflow

1. Run `node scripts/repoproof.mjs audit . --output repoproof-output`.
2. Read `repoproof-output/repoproof-report.json` before drawing conclusions.
3. If the user explicitly permits execution, run `node scripts/repoproof.mjs prove . --allow-exec --output repoproof-output`.
4. If fixes are requested, run `node scripts/repoproof.mjs fix . --dry-run --output repoproof-output` and inspect `repoproof-fixes.patch`.
5. Report only what the evidence supports. Mark unproven claims as unproven.

## Safety Rules

- Audit mode is the default and must not execute repository code.
- Prove mode requires explicit user approval with `--allow-exec` or a CI runner.
- Never publish, deploy, push, merge, or read user secrets.
- Never claim strong sandboxing without a real container, VM, or OS sandbox.
- Use deterministic scripts for evidence collection and redaction.

## References

- Read `references/workflow.md` for the full audit/prove/fix workflow.
- Read `references/safety-model.md` before executing repository code.
- Read `references/extraction-rules.md` when README step extraction is ambiguous.
- Read `references/fix-policy.md` before proposing edits.
- Read `references/evidence-schema.md` when interpreting reports.
- Read `references/github-action.md` before adding CI.
- Read `references/platform-notes.md` for Windows, macOS, and Linux differences.
