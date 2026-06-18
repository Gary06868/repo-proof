# Platform Notes

Windows:

- Use explicit commands and avoid POSIX-only snippets in README examples.
- PowerShell should run with `-NoProfile -NonInteractive` when used by an agent.
- Treat reparse points, junctions, and drive-letter paths carefully.

macOS:

- Do not assume `sandbox-exec` is available or stable.
- Avoid reading Keychain or user shell profiles.

Linux:

- Do not treat `chroot` as a security boundary.
- Avoid inherited SSH agent, cloud metadata, and `/proc` credential leaks.
