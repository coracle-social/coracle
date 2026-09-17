import {nthNe} from "@welshman/lib"
import {DIRECT_MESSAGE_FILE, tagSpec, tagValue} from "@welshman/util"
import {
  DirectMessageQuery,
  DirectMessageReader,
  DirectMessageWriter,
  KindFactory,
} from "@welshman/domain"

// Everything a file message says about its one file, dropped before it is pointed at another
const FILE_KEYS = [
  "file-type",
  "m",
  "x",
  "ox",
  "size",
  "dim",
  "blurhash",
  "thumb",
  "fallback",
  "encryption-algorithm",
  "decryption-key",
  "decryption-nonce",
]

// NIP-17 kind-15 file message. The url is the content, and everything it takes to read the file
// lives in the event's own tags rather than in an imeta tag — including the decryption key, since
// an attachment to a direct message is encrypted before it is uploaded.
export class DirectMessageFileWriter extends DirectMessageWriter {
  setFile(url: string, meta: string[][]) {
    this.setContent(url)
    this.dropTags(t => FILE_KEYS.includes(t[0]))

    // The url is the content here, so it isn't also a tag
    const tags = meta.filter(nthNe(0, "url"))
    const mimeType = tagValue(tagSpec("m"), tags)

    // NIP-17 calls the mime type `file-type`; imeta calls the same thing `m`
    if (mimeType && !tagValue(tagSpec("file-type"), tags)) {
      tags.push(["file-type", mimeType])
    }

    this.addTags(...tags)

    return this
  }

  validate() {
    super.validate()

    if (!this.content) {
      throw new Error("A file message must reference a file via its content")
    }
  }
}

export const DirectMessageFile = new KindFactory({
  kind: DIRECT_MESSAGE_FILE,
  reader: DirectMessageReader,
  writer: DirectMessageFileWriter,
  query: DirectMessageQuery,
})
