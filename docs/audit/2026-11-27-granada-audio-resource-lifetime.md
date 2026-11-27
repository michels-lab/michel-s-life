# Granada — playback resource lifetime

Release media element source and decoder on stop/replacement/preview completion before revoking local Blob URL, rather than only pausing. Stale asynchronous personal reads remain guarded by generation; current errors reported independently of import counts. Handle rejected generated AudioContext resume without altering Focus timer or new playback. Three mocked regressions for decoder release, stale personal reads, and revoke ordering. No real audio size/performance guarantee; physical listening pending.
