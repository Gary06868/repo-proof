# RepoProof Before/After Example

## Before

The fixture README says:

```sh
npm install
npm test
```

The package metadata declares:

```json
{
  "packageManager": "pnpm@9.0.0"
}
```

RepoProof classifies this as `README_PACKAGE_MANAGER_MISMATCH` because a new user following the visible README would use the wrong package manager.

## Fix

`repoproof fix --dry-run` generates the smallest documentation patch:

```diff
- npm install
- npm test
+ pnpm install
+ pnpm test
```

## After

The repaired README can be re-run through `repoproof audit` or `repoproof prove --allow-exec` to produce a fresh evidence report.

