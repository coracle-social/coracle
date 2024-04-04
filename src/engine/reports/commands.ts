import {generatePrivateKey} from "src/util/nostr"
import {hints, forcePlatformRelays} from "src/engine/relays/utils"
import {createAndPublish} from "src/engine/network/utils"

// Use an ephemeral private key for user privacy
export const publishReport = async (content = "", tags = []) =>
  createAndPublish({
    tags,
    content,
    kind: 1984,
    relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
    sk: generatePrivateKey(),
  })
