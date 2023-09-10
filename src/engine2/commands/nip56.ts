import {generatePrivateKey} from "nostr-tools"
import {signer, getUserRelayUrls} from "src/engine2/queries"
import type {PublishOpts} from "./util"
import {buildEvent} from "./util"
import {Publisher} from "./publisher"

// Use an ephemeral private key for user privacy
export const publishReport = ({relays = null, content = "", tags = []}: PublishOpts) =>
  Publisher.publish({
    relays: relays || getUserRelayUrls("write"),
    event: signer.get().signWithKey(buildEvent(1984, {content, tags}), generatePrivateKey()),
  })
