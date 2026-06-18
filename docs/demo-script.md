# Demo GIF Script

Goal: show that RepoProof catches a README that looks plausible but is false.

The repository includes a generated GIF at `assets/demo.gif`. Regenerate or recapture it whenever the public first-run workflow changes.

## Capture plan

1. Show `fixtures/node/wrong-package-manager/README.md`: it tells users to run `npm install`.
2. Show `fixtures/node/wrong-package-manager/package.json`: the project declares `pnpm@9`.
3. Run:

   ```sh
   pnpm repoproof audit fixtures/node/wrong-package-manager --json --output .tmp/demo-audit
   ```

4. Show the issue code: `README_PACKAGE_MANAGER_MISMATCH`.
5. Run:

   ```sh
   pnpm repoproof fix fixtures/node/wrong-package-manager --dry-run --json --output .tmp/demo-fix
   ```

6. Open `.tmp/demo-fix/repoproof-fixes.patch`.
7. Run a known-good proof:

   ```sh
   pnpm repoproof prove fixtures/node/good-cli --allow-exec --json --output .tmp/demo-prove
   ```

8. Show `.tmp/demo-prove/repoproof-report.md` with command, exit code, duration, and cleanroom path.

## Suggested on-screen text

- "CI can be green while README onboarding is broken."
- "RepoProof treats README as the user contract."
- "Fresh clone. Visible commands. Evidence report."
