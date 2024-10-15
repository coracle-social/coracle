import type {Tags} from "@welshman/util"
import {displayList} from "hurdak"
import {getSetting, uploadFiles} from "src/engine"

// dropzone action to handle drag and drop of files
export function dropzone(node, options = {}) {
  function handleDragEnter(event) {
    event.preventDefault()
    event.stopPropagation()
    node.dispatchEvent(new CustomEvent("enter"))
  }

  function handleDragLeave(event) {
    event.preventDefault()
    event.stopPropagation()
    node.dispatchEvent(new CustomEvent("leave"))
  }

  function handleDragOver(event) {
    event.preventDefault()
    event.stopPropagation()
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    console.log(event.dataTransfer.files)
    const files = Array.from(event.dataTransfer.files)
    node.dispatchEvent(new CustomEvent("filedrop", {detail: {files}}))
  }

  node.addEventListener("dragenter", handleDragEnter)
  node.addEventListener("dragleave", handleDragLeave)
  node.addEventListener("dragover", handleDragOver)
  node.addEventListener("drop", handleDrop)

  return {
    destroy() {
      node.removeEventListener("dragenter", handleDragEnter)
      node.removeEventListener("dragleave", handleDragLeave)
      node.removeEventListener("dragover", handleDragOver)
      node.removeEventListener("drop", handleDrop)
    },
  }
}

// utility function to be used as a callback in the drop event
export async function onFileDrop(
  files: File[],
  hostLimit: number = 1,
  compose?: any,
): Promise<Tags[]> {
  const urls = getSetting("nip96_urls").slice(0, hostLimit)
  let uploadContent = ""
  if (compose) {
    uploadContent = files.reduce(
      (acc, cur) => acc + "\n![Uploading " + cur.name + " using " + displayList(urls) + "]",
      "",
    )
    compose.write(uploadContent)
  }
  try {
    const tags = await uploadFiles(urls, files)
    if (compose) {
      const content = compose.parse()
      compose.clear()
      compose.write(content.replace(uploadContent.trim(), ""))
    }
    return tags
  } catch (e) {
    if (compose) {
      const content = compose.parse()
      compose.clear()
      compose.write(content.replace(uploadContent.trim(), ""))
    }
    return []
  }
}
