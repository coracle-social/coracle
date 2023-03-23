<script lang="ts">
  let input = null

  // Line breaks are wrapped in divs sometimes
  const isLineBreak = node => {
    if (node.tagName === "BR") {
      return true
    }

    if (node.tagName === "DIV") {
      return true
    }

    return false
  }

  const isFancy = node => node instanceof Element && !isLineBreak(node)

  const onInput = e => {
    for (const node of input.childNodes) {
      if (isLineBreak(node)) {
        continue
      }

      // Remove gunk that gets copy/pasted, or bold/italic tags that can be added with hotkeys
      if (node instanceof Element && !node.dataset.coracle) {
        node.replaceWith(document.createTextNode(node.textContent))
      }
    }

    const selection = window.getSelection()
    const {focusNode: node, focusOffset: offset} = selection

    // If we're editing something we've already linked, un-link it
    if (node !== input && node.parentNode !== input && isFancy(node.parentNode)) {
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
      const lineBreaks = child.querySelectorAll?.("br") || []

      // Line breaks may be bare brs or divs wrapping brs
      if (lineBreaks.length > 0) {
        content += "\n".repeat(lineBreaks.length)
      } else if (isLineBreak(child)) {
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
  class="w-full min-w-0 p-2 text-gray-3 outline-0"
  autofocus
  contenteditable
  bind:this={input}
  on:input={onInput}
  on:keydown
  on:keyup />
