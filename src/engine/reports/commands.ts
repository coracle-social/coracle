import {createEvent} from "paravel"
import {generatePrivateKey} from "src/util/nostr"
import {signer} from "src/engine/session/derived"
import {hints} from "src/engine/relays/utils"
import {Publisher} from "src/engine/network/utils"

// Use an ephemeral private key for user privacy
export const publishReport = async (content = "", tags = []) =>
  Publisher.publish({
    relays: hints.WriteRelays().getUrls(),
    event: await signer.get().signWithKey(createEvent(1984, {content, tags}), generatePrivateKey()),
  })
