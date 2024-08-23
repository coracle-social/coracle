import type {JSONContent, PasteRuleMatch} from '@tiptap/core'

export const createPasteRuleMatch = <T extends Record<string, unknown>>(
  match: RegExpMatchArray,
  data: T,
): PasteRuleMatch => ({ index: match.index!, replaceWith: match[2], text: match[0], match, data })

export const findNodes = (json: JSONContent, type: string) => {
  const results: JSONContent[] = []

  for (const node of json.content || []) {
    if (node.type === type) {
      results.push(node)
    }

    for (const result of findNodes(node, type)) {
      results.push(result)
    }
  }

  return results
}
