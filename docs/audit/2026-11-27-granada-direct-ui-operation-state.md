# Granada — updater Settings operation isolation

Keep response handlers bound to their original controls, not global queries that can repaint a newly mounted panel. Lock contradictory actions during download/check/installer/permission/discard, preserve cancellation, treat busy and unknown timeout outcomes distinctly, use strict readiness/staging booleans. Extend installer UI timeout to cover metadata lookups. Added production-function VM regressions for stale panel response and concurrent click rejection. No native installer or physical validation in this test; exact CI pending.
