# Incidents And Learnings

## Entry Schema
- Date
- Trigger
- Impact
- Root Cause
- Fix
- Prevention Rule
- Evidence
- Commit
- Confidence

## Entries

### 2026-02-10: CI Smoke Hang
- Trigger: GitHub Actions run hung during the `Smoke` step (`npm run smoke`).
- Impact: CI runs did not complete; newer pushes queued/cancelled older runs.
- Root Cause: Smoke script signaled the dev server but did not ensure process-tree termination; Node process stayed alive in CI.
- Fix: Spawn dev server in its own process group and add SIGTERM then SIGKILL shutdown with timeouts.
- Prevention Rule: Any smoke/e2e harness must have a deterministic shutdown path (process-group kill + hard timeout).
- Evidence: GH Actions run stuck at `Smoke`; follow-up run `21866084918` completed successfully.
- Commit: `5b4c202`
- Confidence: high

### 2026-02-12T20:01:48Z | Codex execution failure
- Date: 2026-02-12T20:01:48Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-2.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:05:15Z | Codex execution failure
- Date: 2026-02-12T20:05:15Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-3.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:08:45Z | Codex execution failure
- Date: 2026-02-12T20:08:45Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-4.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:12:11Z | Codex execution failure
- Date: 2026-02-12T20:12:11Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-5.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:15:46Z | Codex execution failure
- Date: 2026-02-12T20:15:46Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-6.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:19:12Z | Codex execution failure
- Date: 2026-02-12T20:19:12Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-7.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:22:38Z | Codex execution failure
- Date: 2026-02-12T20:22:38Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-8.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:26:20Z | Codex execution failure
- Date: 2026-02-12T20:26:20Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-9.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:29:50Z | Codex execution failure
- Date: 2026-02-12T20:29:50Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-10.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:33:16Z | Codex execution failure
- Date: 2026-02-12T20:33:16Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-11.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:36:44Z | Codex execution failure
- Date: 2026-02-12T20:36:44Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-12.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:40:13Z | Codex execution failure
- Date: 2026-02-12T20:40:13Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-13.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:43:42Z | Codex execution failure
- Date: 2026-02-12T20:43:42Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-14.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:47:14Z | Codex execution failure
- Date: 2026-02-12T20:47:14Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-15.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:50:47Z | Codex execution failure
- Date: 2026-02-12T20:50:47Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-16.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:54:18Z | Codex execution failure
- Date: 2026-02-12T20:54:18Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-17.log
- Commit: pending
- Confidence: medium

### 2026-02-12T20:57:49Z | Codex execution failure
- Date: 2026-02-12T20:57:49Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-18.log
- Commit: pending
- Confidence: medium

### 2026-02-12T21:01:16Z | Codex execution failure
- Date: 2026-02-12T21:01:16Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-19.log
- Commit: pending
- Confidence: medium

### 2026-02-12T21:04:44Z | Codex execution failure
- Date: 2026-02-12T21:04:44Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-20.log
- Commit: pending
- Confidence: medium

### 2026-02-12T21:08:14Z | Codex execution failure
- Date: 2026-02-12T21:08:14Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-21.log
- Commit: pending
- Confidence: medium

### 2026-02-12T21:11:50Z | Codex execution failure
- Date: 2026-02-12T21:11:50Z
- Trigger: Codex execution failure
- Impact: Repo session did not complete cleanly
- Root Cause: codex exec returned a non-zero status
- Fix: Captured failure logs and kept repository in a recoverable state
- Prevention Rule: Re-run with same pass context and inspect pass log before retrying
- Evidence: pass_log=logs/20260212-101456-page-load-lab-cycle-22.log
- Commit: pending
- Confidence: medium
