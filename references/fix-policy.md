# Fix Policy

RepoProof fix mode must prefer the smallest change that makes README evidence true.

Allowed v1 fixes:

- Replace README package manager commands when package metadata clearly disagrees.
- Add a minimal `.env.example` when environment variables are documented but no sample exists.
- Add or correct a GitHub Action companion workflow.
- Correct obvious README port or file references when there is unambiguous local evidence.

Disallowed v1 fixes:

- Rewrite the project architecture.
- Add large new dependencies.
- Commit, push, deploy, or publish.
- Invent behavior not present in the repository.
- Hide failures by deleting tests or examples.
