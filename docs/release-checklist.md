# Release Checklist

RepoProof releases must prove the project before asking anyone else to trust it.

## v0.1.x release gates

Run these commands from a clean checkout:

```sh
pnpm install
pnpm verify
pnpm release:dry-run
npm pack --dry-run
```

The release is blocked if any command fails, if `repoproof-report.json` is invalid, or if the self-audit reports errors.

## Immutable release policy

- Never rewrite public version tags.
- Publish release candidates as `v0.1.0-rc.N` before `v0.1.0`.
- Attach `SHA256SUMS`, `sbom.spdx.json`, and `release-manifest.json`.
- Prefer GitHub artifact attestations for release assets when the release workflow runs on GitHub-hosted runners.
- Pin third-party GitHub Actions by SHA in downstream production workflows.

## Release dry-run output

`pnpm release:dry-run` generates:

- `.tmp/release-dry-run/repoproof-report.json`
- `.tmp/release-dry-run/repoproof-report.md`
- `.tmp/release-artifacts/SHA256SUMS`
- `.tmp/release-artifacts/sbom.spdx.json`
- `.tmp/release-artifacts/release-manifest.json`

## Demo asset

Use `docs/demo-script.md` as the capture script for the 15-30 second demo GIF. The checked-in GIF is `assets/demo.gif`; `assets/demo-storyboard.svg` is the static fallback. The GIF should show the failing fixture, the cleanroom proof, the minimal patch, and the generated report.
