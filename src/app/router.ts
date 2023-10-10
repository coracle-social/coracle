import {nip19} from "nostr-tools"
import {Router} from "src/util/router"
import {getNip24ChannelId} from "src/engine"

export const router = new Router()

router.extend("media", encodeURIComponent)
router.extend("notes", nip19.noteEncode)
router.extend("people", nip19.npubEncode)
router.extend("relays", nip19.nrelayEncode)
router.extend("channels", getNip24ChannelId)
