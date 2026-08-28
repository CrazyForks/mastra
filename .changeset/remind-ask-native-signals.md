---
'@mastra/memory': minor
---

Let the main agent ask the Subconscious reminder agent questions through the session's continuing reminder conversation.

`ask_memory` now accepts a question immediately and delivers the correlated terminal answer reactively through the source agent's signal stream. The previous `wait` input is removed; a blocking checkpoint is temporarily unavailable on this branch and will be introduced separately.
