import {getUserRelayUrls, signer} from "src/engine2/queries"
import {Publisher} from "./publisher"
import {buildEvent, uniqTags, tagsFromContent} from "./util"

type CreateNoteOpts = {
  content?: string
  tags?: string[][]
  relays?: string[]
}

export const createNote = ({content = "", tags = [], relays}: CreateNoteOpts) =>
  Publisher.publish({
    relays: relays || getUserRelayUrls("write"),
    event: signer.get().signAsUser(
      buildEvent(1, {
        content,
        tags: uniqTags([...tags, tagsFromContent(content)]),
      })
    ),
  })
