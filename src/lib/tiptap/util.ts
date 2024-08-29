import type {JSONContent, PasteRuleMatch} from "@tiptap/core"

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
