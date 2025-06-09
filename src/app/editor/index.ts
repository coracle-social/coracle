import {mount} from "svelte"
import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import {sha256} from "@welshman/lib"
import {
  getTagValues,
  encryptFile,
  uploadBlob,
  makeBlossomAuthEvent,
  getListTags,
} from "@welshman/util"
import {Router} from "@welshman/router"
import {Nip01Signer} from "@welshman/signer"
import {signer, profileSearch, userBlossomServers} from "@welshman/app"
import type {FileAttributes} from "@welshman/editor"
import {Editor, MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {makeMentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"
import {pushToast} from "@app/toast"

export const getBlossomServer = () => {
  const userUrls = getTagValues("server", getListTags(userBlossomServers.get()))

  for (const url of userUrls) {
    return url.replace(/^ws/, "http")
  }

  return "https://cdn.satellite.earth"
}

export const makeEditor = async ({
  aggressive = false,
  autofocus = false,
  charCount,
  content = "",
  placeholder = "",
  url,
  submit,
  uploading,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  charCount?: Writable<number>
  content?: string
  placeholder?: string
  url?: string
  submit: () => void
  uploading?: Writable<boolean>
  wordCount?: Writable<number>
}) => {
  return new Editor({
    content,
    autofocus,
    element: document.createElement("div"),
    extensions: [
      WelshmanExtension.configure({
        submit,
        extensions: {
          placeholder: {
            config: {
              placeholder,
            },
          },
          breakOrSubmit: {
            config: {
              aggressive,
            },
          },
          fileUpload: {
            config: {
              upload: async (attrs: FileAttributes) => {
                let file: Blob = attrs.file

                if (!file.type.match("image/(webp|gif)")) {
                  const {default: Compressor} = await import("compressorjs")

                  file = await new Promise((resolve, _reject) => {
                    new Compressor(file, {
                      maxWidth: 1024,
                      maxHeight: 1024,
                      convertSize: 2 * 1024 * 1024,
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

                const {ciphertext, key, nonce, algorithm} = await encryptFile(file)
                const tags = [
                  ["decryption-key", key],
                  ["decryption-nonce", nonce],
                  ["encryption-algorithm", algorithm],
                ]

                file = new File([new Blob([ciphertext])], attrs.file.name, {type: attrs.file.type})

                const server = getBlossomServer()
                const hashes = [await sha256(await file.arrayBuffer())]
                const $signer = signer.get() || Nip01Signer.ephemeral()
                const authTemplate = makeBlossomAuthEvent({action: "upload", server, hashes})
                const authEvent = await $signer.sign(authTemplate)

                try {
                  const res = await uploadBlob(server, file, {authEvent})
                  let {uploaded, url, ...task} = await res.json()

                  if (!uploaded) {
                    return {error: "Server refused to process the file"}
                  }

                  // Always append file extension if missing
                  if (new URL(url).pathname.split(".").length === 1) {
                    url += "." + attrs.file.type.split("/")[1]
                  }

                  const result = {...task, tags, url}

                  return {result}
                } catch (e: any) {
                  console.error(e)
                  return {error: e.toString()}
                }
              },
              onDrop() {
                uploading?.set(true)
              },
              onComplete() {
                uploading?.set(false)
              },
              onUploadError(currentEditor, task) {
                currentEditor.commands.removeFailedUploads()
                pushToast({theme: "error", message: "Failed to upload file"})
                uploading?.set(false)
              },
            },
          },
          nprofile: {
            extend: {
              addNodeView: () => makeMentionNodeView(url),
              addProseMirrorPlugins() {
                return [
                  MentionSuggestion({
                    editor: (this as any).editor,
                    search: (term: string) => get(profileSearch).searchValues(term),
                    getRelays: (pubkey: string) => Router.get().FromPubkeys([pubkey]).getUrls(),
                    createSuggestion: (value: string) => {
                      const target = document.createElement("div")

                      mount(ProfileSuggestion, {target, props: {value, url}})

                      return target
                    },
                  }),
                ]
              },
            },
          },
        },
      }),
    ],
    onUpdate({editor}) {
      wordCount?.set(editor.storage.wordCount.words)
      charCount?.set(editor.storage.wordCount.chars)
    },
  })
}
