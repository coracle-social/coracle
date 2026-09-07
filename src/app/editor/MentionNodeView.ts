import type {NodeViewProps} from "@welshman/editor"
import {Profiles} from "@welshman/app"
import {fromApp} from "src/engine/core"

export const MentionNodeView = ({node}: NodeViewProps) => {
  const dom = document.createElement("span")
  const display = fromApp($app => $app.use(Profiles).display(node.attrs.pubkey).$)

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
