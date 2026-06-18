# Contributing

RepoProof welcomes contributions in three categories:

1. Documentation improvements.
2. Fixtures that reproduce real README drift.
3. Adapters for new ecosystems.

Every fixture must include:

- A minimal broken repository.
- An `expected` JSON file naming the expected issue codes.
- A short before/after explanation when a safe fix exists.

Adapters start as `experimental`. They become `stable` after at least two independent fixtures pass in CI.

Run before opening a PR:

```sh
pnpm verify
pnpm release:dry-run
```

Release-related changes should also update `docs/release-checklist.md`, the example report under `reports/examples/`, or the demo script when the public workflow changes.
