import {nip19} from "nostr-tools"
import {last} from "ramda"
import {bytes} from "hurdak/lib/hurdak"

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
      convertSize: bytes(1, "mb"),
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

export const noEvent = f => e => {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()

  f()
}

export const parseContent = content => {
  const text = content.trim()
  const result = []
  let buffer = "",
    i = 0

  const push = (type, text, value = null) => {
    if (buffer) {
      result.push({type: "text", value: buffer})
      buffer = ""
    }

    result.push({type, value: value || text})
    i += text.length
  }

  for (; i < text.length; ) {
    const tail = text.slice(i)

    const newLine = tail.match(/^\n+/)

    if (newLine) {
      push("newline", newLine[0])
      continue
    }

    const mentionMatch = tail.match(/^#\[\d+\]/i)

    if (mentionMatch) {
      push("mention", mentionMatch[0])
      continue
    }

    const topicMatch = tail.match(/^#\w+/i)

    if (topicMatch) {
      push("topic", topicMatch[0])
      continue
    }

    const bech32Match = tail.match(/^(nostr:)?n(event|ote|profile|pub)1[\d\w]+/i)

    if (bech32Match) {
      try {
        const entity = bech32Match[0].replace("nostr:", "")
        const {type, data} = nip19.decode(entity) as {type: string; data: object}

        push(`nostr:${type}`, bech32Match[0], {...data, entity})
        continue
      } catch (e) {
        console.log(e)
        // pass
      }
    }

    const urlMatch = tail.match(
      /^((http|ws)s?:\/\/)?[-a-z0-9@:%_\+~#=\.]+\.[a-z]{1,6}[-a-z0-9:%_\+~#\?!&\/=;\.]*/gi
    )

    // Skip url if it's just the end of a filepath
    if (urlMatch && !last(result)?.value.endsWith("/")) {
      let url = urlMatch[0]

      // Skip ellipses and very short non-urls
      if (!url.match(/\.\./) && url.length > 4) {
        // It's common for punctuation to end a url, trim it off
        if (url.match(/[\.\?,:]$/)) {
          url = url.slice(0, -1)
        }

        if (!url.match("://")) {
          url = "https://" + url
        }

        push("link", urlMatch[0], url)
        continue
      }
    }

    // Instead of going character by character and re-running all the above regular expressions
    // a million times, try to match the next word and add it to the buffer
    const wordMatch = tail.match(/^[\w\d]+ ?/i)

    if (wordMatch) {
      buffer += wordMatch[0]
      i += wordMatch[0].length
    } else {
      buffer += text[i]
      i += 1
    }
  }

  if (buffer) {
    result.push({type: "text", value: buffer})
  }

  return result
}

export const isMobile = localStorage.mobile || window.navigator.maxTouchPoints > 1

export const parseHex = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}
