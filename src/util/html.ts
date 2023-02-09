import {ellipsize} from 'hurdak/lib/hurdak'

export const copyToClipboard = text => {
  const {activeElement} = document
  const input = document.createElement("textarea")

  input.innerHTML = text
  document.body.appendChild(input)
  input.select()

  const result = document.execCommand("copy")

  document.body.removeChild(input)
  ;(activeElement as HTMLElement).focus()

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

export const fromParentOffset = (element, offset): [HTMLElement, number] => {
  for (const child of element.childNodes) {
    if (offset <= child.textContent.length) {
      return [child, offset]
    }

    offset -= child.textContent.length
  }

  throw new Error("Unable to find parent offset")
}

export const extractUrls = content => {
  const regex = /(https?:\/\/)?(www\.)?[-a-z0-9@:%._\+~#=]{1,256}\.[a-z]{1,6}\b([-a-z0-9@:%_\+.~#?!&//=;]*)/gi
  const urls = content.match(regex)

  return (urls || [])
    // Skip decimals like 3.5 and ellipses which have more than one dot in a row
    .filter(url => !url.match(/^[\d\.]+$/) && !url.match(/\.{2}/))
}

export const renderContent = content => {
  // Escape html
  content = escapeHtml(content)

  // Extract urls
  for (const url of extractUrls(content)) {
    const $a = document.createElement('a')

    $a.href = 'https://' + url
    $a.target = "_blank"
    $a.className = "underline"

    /* eslint no-useless-escape: 0 */
    $a.innerText = ellipsize(url.replace(/https?:\/\/(www\.)?/, ''), 50)

    // If the url is on its own line, remove it entirely. Otherwise, replace it with the link
    content = content.replace(url, $a.outerHTML)
  }

  return content.trim()
}
