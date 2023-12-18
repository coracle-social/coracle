import {createEvent} from "paravel"
import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {getUserHints} from "src/engine/relays/utils"
import {Publisher} from "src/engine/network/utils"

// Use an ephemeral private key for user privacy
export const publishReport = async (content = "", tags = [], relays = null) =>
  Publisher.publish({
    relays: relays || getUserHints("write"),
    event: await signer.get().signWithKey(createEvent(1984, {content, tags}), generatePrivateKey()),
  })
