import type {JSONContent, PasteRuleMatch, InputRuleMatch} from "@tiptap/core"
import {Editor} from "@tiptap/core"
import {choice} from "@welshman/lib"
import {Address} from "@welshman/util"

export const asInline = (extend: Record<string, any>) => ({
  inline: true,
  group: "inline",
  ...extend,
})

export const createInputRuleMatch = <T extends Record<string, unknown>>(
  match: RegExpMatchArray,
  data: T,
): InputRuleMatch => ({index: match.index!, text: match[0], match, data})

export const createPasteRuleMatch = <T extends Record<string, unknown>>(
  match: RegExpMatchArray,
  data: T,
): PasteRuleMatch => ({index: match.index!, text: match[0], match, data})

export const findNodes = (type: string, json: JSONContent) => {
  const results: JSONContent[] = []

  for (const node of json.content || []) {
    if (node.type === type) {
      results.push(node)
    }

    for (const result of findNodes(type, node)) {
      results.push(result)
    }
  }

  return results
}

export const findMarks = (type: string, json: JSONContent) => {
  const results: JSONContent[] = []

  for (const node of json.content || []) {
    for (const mark of node.marks || []) {
      if (mark.type === type) {
        results.push(mark)
      }
    }

    for (const result of findMarks(type, node)) {
      results.push(result)
    }
  }

  return results
}

export const getEditorTags = (editor: Editor) => {
  const json = editor.getJSON()

  const topicTags = findMarks("tag", json).map(
    ({attrs}: any) => ["t", attrs.tag.replace(/^#/, '').toLowerCase()],
  )

  const naddrTags = findNodes("naddr", json).map(
    ({kind, pubkey, identifier, relays}: any) => {
      const address = new Address(kind, pubkey, identifier).toString()

      return ["q", address, choice(relays) || "", pubkey]
    },
  )

  const neventTags = findNodes("nevent", json).map(
    ({id, author, relays}: any) => ["q", id, choice(relays) || "", author || ""],
  )

  const mentionTags = findNodes("nprofile", json).map(
    ({pubkey, relays}: any) => ["p", pubkey, choice(relays) || "", ""],
  )

  const imetaTags = findNodes("image", json).map(
    ({src, sha256}: any) => ["imeta", `url ${src}`, `x ${sha256}`, `ox ${sha256}`],
  )

  return [...topicTags, ...naddrTags, ...neventTags, ...mentionTags, ...imetaTags]
}

export const addFile = (editor: Editor) => editor.chain().selectFiles().run()

export const uploadFiles = (editor: Editor) => editor.chain().uploadFiles().run()
