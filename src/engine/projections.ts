import {ensurePlaintext, repository} from "@welshman/app"
import type {TrustedEvent} from "@welshman/util"
import {
  APP_DATA,
  FOLLOWS,
  MUTES,
  SEEN_CONTEXT,
  SEEN_CONVERSATION,
  SEEN_GENERAL,
} from "@welshman/util"
import {projections} from "src/engine/state"

// Synchronize repository with projections. All events should be published to the
// repository, and when accepted, be propagated to projections. This avoids processing
// the same event multiple times, since repository deduplicates
repository.on("update", ({added}: {added: TrustedEvent[]}) => {
  for (const event of added) {
    projections.push(event)
  }
})

// Decrypt encrypted events eagerly

projections.addHandler(SEEN_GENERAL, ensurePlaintext)
projections.addHandler(SEEN_CONTEXT, ensurePlaintext)
projections.addHandler(SEEN_CONVERSATION, ensurePlaintext)
projections.addHandler(APP_DATA, ensurePlaintext)
projections.addHandler(FOLLOWS, ensurePlaintext)
projections.addHandler(MUTES, ensurePlaintext)
