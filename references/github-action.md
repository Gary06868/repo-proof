# GitHub Action Companion

The RepoProof Action runs audit mode by default with read-only repository permissions. Prove mode is opt-in because it executes repository commands on the runner.

Recommended permissions:

```yaml
permissions:
  contents: read
```

Recommended first workflow:

```yaml
- uses: <owner>/repo-proof/action@v0.1.0
  with:
    mode: audit
    profile: baseline
    fail-on: error
    upload-artifact: true
```
