import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {getUserRelayUrls} from "src/engine/relays/utils"
import {Publisher, buildEvent} from "src/engine/network/utils"

// Use an ephemeral private key for user privacy
export const publishReport = async (content = "", tags = [], relays = null) =>
  Publisher.publish({
    relays: relays || getUserRelayUrls("write"),
    event: await signer.get().signWithKey(buildEvent(1984, {content, tags}), generatePrivateKey()),
  })
