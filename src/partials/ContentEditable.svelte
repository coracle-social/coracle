<script lang="ts">
  import cx from "classnames"

  let input = null

  // Line breaks are wrapped in divs sometimes
  const isLineBreak = node => {
    if (node.tagName === "BR") {
      return true
    }

    if (node.tagName === "DIV" && !node.getAttribute?.("style")) {
      return true
    }

    return false
  }

  const isFancy = node => node instanceof HTMLElement && !isLineBreak(node)

  const onInput = e => {
    const selection = window.getSelection()
    const {focusNode: node, focusOffset: offset} = selection

    for (const node of input.childNodes) {
      if (isLineBreak(node)) {
        continue
      }

      // Remove gunk that gets copy/pasted, or bold/italic tags that can be added with hotkeys
      if (node instanceof HTMLElement && !node.dataset.coracle) {
        const text = document.createTextNode(node.textContent)

        if (node.tagName === "DIV") {
          const div = document.createElement("div")

          div.appendChild(text)
          node.replaceWith(div)
        } else {
          node.replaceWith(text)
        }
      }
    }

    // If we're editing something we've already linked, un-link it
    if (node !== input && node.parentNode !== input && isFancy(node.parentNode)) {
      // @ts-ignore
      node.parentNode.replaceWith(node)
      selection.collapse(node, offset)
      input.normalize()
    }
  }

  export const getInput = () => input

  const parseNode = node => {
    let content = ""
    let annotations = []

    for (const child of node.childNodes) {
      if (child.tagName === "BR") {
        content += "\n"
      }

      if (child.tagName === "DIV" && !child.querySelector("br")) {
        content += "\n"
      }

      if (child.dataset?.coracle) {
        const {prefix, value} = JSON.parse(child.dataset.coracle)

        content += value
        annotations = annotations.concat({prefix, value})
      } else if (child instanceof Text) {
        content += child.textContent
      } else {
        const info = parseNode(child)

        content += info.content
        annotations = annotations.concat(info.annotations)
      }
    }

    return {content, annotations}
  }

  export const parse = () => parseNode(input)
</script>

<div
  style={$$props.style}
  class={cx($$props.class, "w-full min-w-0 p-2 text-gray-2 outline-0")}
  autofocus
  contenteditable
  bind:this={input}
  on:input={onInput}
  on:keydown
  on:keyup />
