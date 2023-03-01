import {ellipsize, bytes} from 'hurdak/lib/hurdak'

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

export const stripExifData = async (file, opts = {}) => {
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
      maxWidth: 1024,
      maxHeight: 1024,
      convertSize: bytes(1, 'mb'),
      ...opts,
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

export const listenForFile = (input, onChange) => {
  input.addEventListener('change', async e => {
    const target = e.target as HTMLInputElement
    const [file] = target.files

    if (file) {
      onChange(file)
    } else {
      onChange(null)
    }
  })
}

export const blobToString = async blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = reject
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })

export const blobToFile = blob =>
    new File([blob], blob.name, {type: blob.type})

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

export const noEvent = f => e => {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()

  f()
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
  /* eslint no-useless-escape: 0 */

  // Escape html
  content = escapeHtml(content)

  // Extract urls
  for (let url of extractUrls(content)) {
    const $a = document.createElement('a')

    // It's common for a period to end a url, trim it off
    if (url.endsWith('.')) {
      url = url.slice(0, -1)
    }

    const href = url.includes('://') ? url : 'https://' + url
    const display = url.replace(/https?:\/\/(www\.)?/, '')

    $a.href = href
    $a.target = "_blank"
    $a.className = "underline"
    $a.innerText = ellipsize(display, 50)

    content = content.replace(url, $a.outerHTML)
  }

  return content.trim()
}

