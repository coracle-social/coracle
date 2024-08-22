import type {JSONContent} from '@tiptap/core'

export {createSuggestions} from '@lib/tiptap/Suggestions'
export {LinkExtension} from '@lib/tiptap/LinkExtension'

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
