# Project operating rules

GitHub Issues are the persistent task pool and handoff record. Read the relevant Issue, latest checkpoint, README, docs and diff before editing. Prefer resumable work, then actionable Pending tasks. Track lifecycle separately from task type: Graveyard → Idle → Pending → WIP → Qualified → Ranked. Claim work as WIP; move technically verified work to Qualified. Human acceptance and merge are required for Ranked.

Before stopping unfinished work, preserve changes, commit/push where possible and record a checkpoint in the Issue containing completed/remaining work, branch/PR, executed checks, limitations and exact next steps.

Keep chapter sources in story/*.json and compile with tools/build-story.py. Do not run seed-story.py over edited chapters. Shared engine modules must remain unchanged; original hashes are in docs/engine-sha256.json. Keep story-specific behavior in game/.

Use responsive.css for touch and portrait layouts. Preserve complete photographic framing. Test small portrait phones, landscape phones, portrait/landscape tablets and desktop, including menu, long text, choices and rotation.

Public assets must retain attribution and license records. Never publish secrets, local auth files, candidate downloads, browser profiles or test output. Build the Pages artifact with tools/build-site.mjs; do not upload the full workspace. Publishing and GitHub operations must follow the current human authorization and host authentication rules.
