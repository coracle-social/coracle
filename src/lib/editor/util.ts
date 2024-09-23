import type {JSONContent, PasteRuleMatch} from "@tiptap/core"
import {Editor} from "@tiptap/core"
import {choice} from "@welshman/lib"

export const asInline = (extend: Record<string, any>) => ({
  inline: true,
  group: "inline",
  ...extend,
})

export const createPasteRuleMatch = <T extends Record<string, unknown>>(
  match: RegExpMatchArray,
  data: T,
): PasteRuleMatch => ({index: match.index!, replaceWith: match[2], text: match[0], match, data})

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

export const getEditorTags = (editor: Editor) => {
  const json = editor.getJSON()

  const withAttrs = (f: any) => (attrs: any) => f(attrs as Record<string, any>)

  const mentionTags = findNodes("nprofile", json).map(
    withAttrs(({pubkey, relays}: any) => ["p", pubkey, choice(relays), ""]),
  )

  const imetaTags = findNodes("image", json).map(
    withAttrs(({src, sha256}: any) => ["imeta", `url ${src}`, `x ${sha256}`, `ox ${sha256}`]),
  )

  return [...mentionTags, ...imetaTags]
}

export const addFile = (editor: Editor) => editor.chain().selectFiles().run()

export const uploadFiles = (editor: Editor) => editor.chain().uploadFiles().run()
