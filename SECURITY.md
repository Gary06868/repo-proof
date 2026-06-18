# Security Policy

## Supported Versions

Only the latest `0.x` release receives security fixes before v1.0.

## Reporting a Vulnerability

Open a private security advisory or email the maintainer listed in the release notes. Do not open a public issue for suspected vulnerabilities.

## Security Boundary

RepoProof is not a sandbox. In audit mode it performs static inspection. In prove mode it executes repository commands only after explicit user approval or inside a CI runner. Reports are redacted before writing.

RepoProof will never intentionally publish, deploy, push, merge, or read user secrets.
