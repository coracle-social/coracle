import type {NodeViewProps} from '@tiptap/core'

export const Bolt11NodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement('span')

  dom.classList.add('tiptap-object')
  dom.innerText = `${node.attrs.lnbc.slice(0, 16)}...`

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
