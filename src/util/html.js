export const copyToClipboard = text => {
  const {activeElement} = document
  const input = document.createElement("textarea")

  input.innerHTML = text
  document.body.appendChild(input)
  input.select()

  const result = document.execCommand("copy")

  document.body.removeChild(input)
  activeElement.focus()

  return result
}

export const stripExifData = async file => {
  if (window.DataTransferItem && file instanceof DataTransferItem) {
    file = file.getAsFile()
  }

  if (!file) {
    return file
  }

  const {default: Compressor} = await import("compressorjs")

  /* eslint no-new: 0 */

  return new Promise((resolve, _reject) => {
    new Compressor(file, {
      maxWidth: 50,
      maxHeight: 50,
      convertSize: 1024,
      success: resolve,
      error: e => {
        // Non-images break compressor
        if (e.toString().includes("File or Blob")) {
          return resolve(file)
        }

        _reject(e)
      },
    })
  })
}

export const hasParent = (tagOrClass, $el) => {
  while ($el) {
    if (tagOrClass.startsWith('.')) {
      if ($el.classList?.contains(tagOrClass.slice(1))) {
        return true
      }
    } else if ($el.tagName === tagOrClass.toUpperCase()) {
      return true
    }

    $el = $el.parentNode
  }

  return false
}

export const escapeHtml = html => {
  const div = document.createElement("div")

  div.innerText = html

  return div.innerHTML
}

export const killEvent = e => {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}

export const fromParentOffset = (element, offset) => {
  for (const child of element.childNodes) {
    if (offset <= child.textContent.length) {
      return [child, offset]
    }

    offset -= child.textContent.length
  }
}
