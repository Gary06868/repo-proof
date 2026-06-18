# Baseline Comparison

| Condition | Expected success rate | Notes |
|---|---:|---|
| baseline-agent | 35% | Often reasons from package files but does not create cleanroom evidence. |
| explicit-repo-proof | 85% | Uses deterministic scripts and produces reports. |
| implicit-repo-proof | 75% | Depends on trigger reliability. |

## Failure cases

- baseline-agent may declare success after reading scripts without running a fresh clone.
- explicit-repo-proof may block execution when dangerous scripts are detected.
- implicit-repo-proof may fail to trigger for vague requests such as "check this repo".
