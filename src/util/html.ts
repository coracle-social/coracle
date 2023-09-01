import {bytes} from "hurdak"

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
      maxWidth: 2048,
      maxHeight: 2048,
      convertSize: bytes(10, "mb"),
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
  input.addEventListener("change", async e => {
    const target = e.target as HTMLInputElement

    if (target.files.length > 0) {
      onChange(Array.from(target.files))
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

export const blobToFile = blob => new File([blob], blob.name, {type: blob.type})

export const stripHtml = html => {
  const doc = new DOMParser().parseFromString(html, "text/html")

  return doc.body.textContent || ""
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

export const isMobile =
  localStorage.mobile || window.navigator.maxTouchPoints > 1 || window.innerWidth < 400

export const parseHex = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}
