import type {NodeViewProps} from '@tiptap/core'
import {fromNostrURI} from "@welshman/util"

export const EventNodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement('span')

  dom.classList.add('tiptap-object')
  dom.innerText = `${fromNostrURI(node.attrs.bech32).slice(0, 16)}...`

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
