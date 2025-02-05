import type {NodeViewProps} from '@tiptap/core'

export const MentionNodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement('span')

  dom.classList.add('tiptap-object')
  dom.textContent = `@${node.attrs.bech32.slice(0, 16)}...`

  return {
    dom,
    selectNode() {
      dom.classList.add('tiptap-active')
    },
    deselectNode() {
      dom.classList.remove('tiptap-active')
    },
  }
}
