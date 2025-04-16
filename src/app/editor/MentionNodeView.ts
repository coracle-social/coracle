import type {NodeViewProps} from "@tiptap/core"
import {removeNil} from "@welshman/lib"
import {deriveProfileDisplay} from "@welshman/app"

export const makeMentionNodeView =
  (url?: string) =>
  ({node}: NodeViewProps) => {
    const dom = document.createElement("span")
    const display = deriveProfileDisplay(node.attrs.pubkey, removeNil([url]))

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
