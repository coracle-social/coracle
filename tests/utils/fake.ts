import type {TrustedEvent} from "@welshman/util"

function getTestTrustedEvent(overrides?: Partial<TrustedEvent>) {
  const event: TrustedEvent = {
    tags: [],
    content: "Nostr is awesome!",
    kind: 1,
    created_at: 21,
    pubkey: "testpubkey",
    id: "testid1",
  }

  return {...event, ...overrides}
}

export {getTestTrustedEvent}
