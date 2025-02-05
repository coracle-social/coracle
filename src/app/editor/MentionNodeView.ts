import type {NodeViewProps} from "@tiptap/core"
import {deriveProfileDisplay} from "@welshman/app"

export const MentionNodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement("span")
  const display = deriveProfileDisplay(node.attrs.pubkey)

  dom.classList.add("tiptap-object")

  const unsubDisplay = display.subscribe($display => {
    dom.textContent = "@" + $display
  })

  return {
    dom,
    destroy: () => {
      unsubDisplay()
    },
    selectNode() {
      dom.classList.add("tiptap-active")
    },
    deselectNode() {
      dom.classList.remove("tiptap-active")
    },
  }
}
