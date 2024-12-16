import type {CommandProps, Editor} from "@tiptap/core"
import {Extension} from "@tiptap/core"
import {now} from "@welshman/lib"
import type {ImageAttributes, VideoAttributes} from "nostr-editor"
import type {EventTemplate, NostrEvent} from "nostr-tools/core"
import {readServerConfig, uploadFile} from "nostr-tools/nip96"
import {getToken} from "nostr-tools/nip98"
import type {Node} from "prosemirror-model"
import {Plugin, PluginKey} from "prosemirror-state"
import {writable} from "svelte/store"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    uploadFile: {
      selectFiles: () => ReturnType
      uploadFiles: () => ReturnType
      getMetaTags: () => string[][]
    }
  }
}

export interface FileUploadOptions {
  allowedMimeTypes: string[]
  expiration: number
  immediateUpload: boolean
  hash: (file: File) => Promise<string>
  sign?: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent
  onDrop: (currentEditor: Editor, file: File, pos: number) => void
  onComplete: (currentEditor: Editor) => void
}

interface UploadTask {
  url?: string
  sha256?: string
  error?: string
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

export const FileUploadExtension = Extension.create<FileUploadOptions>({
  name: "fileUpload",

  addStorage() {
    return {
      loading: writable(false),
      tags: [] as string[][],
    }
  },

  addOptions() {
    return {
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "video/mpeg",
        "video/webm",
      ],
      immediateUpload: true,
      expiration: 60000,
      async hash(file: File) {
        return bufferToHex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))
      },
      onDrop() {},
      onComplete() {},
    }
  },

  addCommands() {
    return {
      selectFiles: () => props => {
        props.tr.setMeta("selectFiles", true)
        return true
      },
      uploadFiles: () => (props: CommandProps) => {
        props.tr.setMeta("uploadFiles", true)
        return true
      },
      getMetaTags: () =>
        ((props: CommandProps) => {
          const tags: string[][] = []
          // make sure the file uploaded is still in the editor content
          props.editor.state.doc.descendants(node => {
            if (!(node.type.name === "image" || node.type.name === "video")) {
              return
            }
            const tag: string[] = props.editor.storage.fileUpload.tags.find(t =>
              t[1].includes(node.attrs.src),
            )
            if (tag) {
              tags.push(tag)
            }
          })
          return tags
        }) as any,
    }
  },

  addProseMirrorPlugins() {
    const uploader = new Uploader(this.editor, this.options)
    return [
      new Plugin({
        key: new PluginKey("fileUploadPlugin"),
        state: {
          init() {
            return {}
          },
          apply(tr) {
            setTimeout(() => {
              if (tr.getMeta("selectFiles")) {
                uploader.selectFiles()
                tr.setMeta("selectFiles", null)
              } else if (tr.getMeta("uploadFiles")) {
                uploader.uploadFiles()
                tr.setMeta("uploadFiles", null)
              }
            })
            return {}
          },
        },
        props: {
          handleDrop: (_, event) => {
            return uploader.handleDrop(event)
          },
        },
      }),
    ]
  },
})

class Uploader {
  constructor(
    public editor: Editor,
    private options: FileUploadOptions,
  ) {}

  get view() {
    return this.editor.view
  }

  addFile(file: File, pos: number) {
    if (
      !this.options.allowedMimeTypes.some(amt => amt.split("*").every(s => file.type.includes(s)))
    ) {
      return false
    }
    const {tr} = this.view.state
    const [mimetype] = file.type.split("/")
    const node = this.view.state.schema.nodes[mimetype].create({
      file,
      src: URL.createObjectURL(file),
      alt: "",
      uploading: false,
      uploadError: null,
    })
    tr.insert(pos, node)
    this.view.dispatch(tr)

    if (this.options.immediateUpload) {
      this.editor.storage.fileUpload.loading.set(true)
      this.upload(node).then(() => this.editor.storage.fileUpload.loading.set(false))
    }
    this.options.onDrop(this.editor, file, pos)
    return true
  }

  findNodePosition(node: Node) {
    let pos = -1
    this.view.state.doc.descendants((n, p) => {
      if (n === node) {
        pos = p
        return false
      }
    })
    return pos
  }

  findNodes(uploading: boolean) {
    const nodes = [] as [Node, number][]
    this.view.state.doc.descendants((node, pos) => {
      if (!(node.type.name === "image" || node.type.name === "video")) {
        return
      }
      if (node.attrs.sha256) {
        return
      }
      if ((node.attrs.uploading || false) !== uploading) {
        return
      }
      nodes.push([node, pos])
    })
    return nodes
  }

  updateNodeAttributes(nodeRef: Node, attrs: Record<string, unknown>) {
    const {tr} = this.editor.view.state

    const pos = this.findNodePosition(nodeRef)
    if (pos === -1) return

    Object.entries(attrs).forEach(
      ([key, value]) => value !== undefined && tr.setNodeAttribute(pos, key, value),
    )
    this.view.dispatch(tr)
  }

  onUploadDone(nodeRef: Node, response: UploadTask) {
    this.findNodes(true).forEach(([node, pos]) => {
      if (node.attrs.src === nodeRef.attrs.src) {
        this.updateNodeAttributes(node, {
          uploading: false,
          src: response.url,
          sha256: response.sha256,
          uploadError: response.error,
        })
      }
    })
  }

  async upload(node: Node) {
    const {sign, hash, expiration} = this.options

    const {
      file,
      alt,
      uploadType,
      uploadUrl: serverUrl,
    } = node.attrs as ImageAttributes | VideoAttributes

    this.updateNodeAttributes(node, {uploading: true, uploadError: null})

    try {
      if (uploadType === "nip96") {
        const res = await uploadNIP96({file, alt, sign, serverUrl})
        // add the tags as received from nip-96 to the storage
        this.editor.storage.fileUpload.tags.push(["imeta", ...res.tags])
        this.onUploadDone(node, res)
      } else {
        const res = await uploadBlossom({file, serverUrl, hash, sign, expiration})
        this.editor.storage.fileUpload.tags.push([
          "imeta",
          `url ${res.url}`,
          `size ${res.size}`,
          `m ${res.type}`,
          `x ${res.sha256}`,
        ])
        this.onUploadDone(node, res)
      }
    } catch (error) {
      const msg = error as string
      this.onUploadDone(node, {error: msg})
      throw new Error(msg as string)
    }
  }

  async uploadFiles() {
    const tasks = this.findNodes(false).map(([node]) => {
      return this.upload(node)
    })
    try {
      this.editor.storage.fileUpload.loading.set(true)
      await Promise.all(tasks)
      this.options.onComplete(this.editor)
    } finally {
      this.editor.storage.fileUpload.loading.set(false)
    }
  }

  selectFiles() {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.accept = this.options.allowedMimeTypes.join(",")
    input.onchange = event => {
      const files = (event.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(file => {
          if (file) {
            const pos = this.view.state.selection.from + 1
            this.addFile(file, pos)
          }
        })
      }
    }
    input.click()
  }

  handleDrop(event: DragEvent) {
    event.preventDefault()

    const pos = this.view.posAtCoords({left: event.clientX, top: event.clientY})?.pos

    if (pos === undefined) return false

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      this.addFile(file, pos)
    }
  }
}

export interface NIP96Options {
  file: File
  alt?: string
  serverUrl: string
  expiration?: number
  sign: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent
}

export async function uploadNIP96(options: NIP96Options) {
  try {
    const server = await readServerConfig(options.serverUrl)
    const authorization = await getToken(server.api_url, "POST", options.sign, true)
    const res = await uploadFile(options.file, server.api_url, authorization, {
      alt: options.alt || "",
      expiration: options.expiration?.toString() || "",
      content_type: options.file.type,
    })
    if (res.status === "error") {
      throw new Error(res.message)
    }
    const url = res.nip94_event?.tags.find(x => x[0] === "url")?.[1] || ""
    const sha256 = res.nip94_event?.tags.find(x => x[0] === "x")?.[1] || ""
    return {
      url,
      sha256,
      tags: res.nip94_event?.tags.flatMap(item => item.join(" ")),
    }
  } catch (error) {
    console.warn(error)
  }
}

export interface BlossomOptions {
  file: File
  serverUrl: string
  expiration?: number
  hash?: (file: File) => Promise<string>
  sign?: (event: EventTemplate) => Promise<NostrEvent> | NostrEvent
}

export interface BlossomResponse {
  sha256: string
  size: number
  type: string
  uploaded: number
  url: string
}

export interface BlossomResponseError {
  message: string
}

export async function uploadBlossom(options: BlossomOptions) {
  if (!options.hash) {
    throw new Error("No hash function provided")
  }
  if (!options.sign) {
    throw new Error("No signer provided")
  }
  const created_at = now()
  const hash = await options.hash(options.file)
  const event = await options.sign({
    kind: 24242,
    content: `Upload ${encodeURIComponent(options.file.name)}`,
    created_at,
    tags: [
      ["t", "upload"],
      ["x", hash],
      ["size", options.file.size.toString()],
      ["expiration", (created_at + (options.expiration || 60000)).toString()],
    ],
  })
  const data = JSON.stringify(event)
  const base64 = btoa(data)
  const authorization = `Nostr ${base64}`
  const res = await fetch(options.serverUrl + "/upload", {
    method: "PUT",
    body: options.file,
    headers: {
      authorization,
    },
  })
  const json = await res.json()
  if (res.status === 200) {
    return json as BlossomResponse
  }
  throw new Error((json as BlossomResponseError).message)
}
