# Fixture Authoring

A RepoProof fixture is a minimal repository that demonstrates one README truth failure.

Requirements:

- Keep the fixture small.
- Do not include secrets.
- Include a README with visible user instructions.
- Include an expected JSON entry under `fixtures/expected`.
- Prefer one primary issue per fixture.

Example issue codes:

- `README_PACKAGE_MANAGER_MISMATCH`
- `MISSING_ENV_EXAMPLE`
- `DANGEROUS_SCRIPT`
- `SERVICE_NOT_REACHABLE`
