import type {Node, NodeViewProps} from '@tiptap/core'
import {fromNostrURI} from "@welshman/util"

export const MediaNodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement('span')

  const syncUploading = (node: NodeViewProps['node']) => {
    if (node.attrs.uploading) {
      dom.classList.add('tiptap-uploading')
    } else {
      dom.classList.remove('tiptap-uploading')
    }
  }

  dom.classList.add('tiptap-object')
  dom.innerText = node.attrs.file?.name || node.attrs.src

  syncUploading(node)

  return {
    dom,
    update(node: NodeViewProps['node']) {
      syncUploading(node)
    },
    selectNode() {
      dom.classList.add('tiptap-active')
    },
    deselectNode() {
      dom.classList.remove('tiptap-active')
    },
  }
}
