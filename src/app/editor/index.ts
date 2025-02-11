import "@welshman/editor/index.css"

import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import {Editor} from "@tiptap/core"
import {ctx} from "@welshman/lib"
import type {UploadTask} from "nostr-editor"
import type {StampedEvent} from "@welshman/util"
import {signer, profileSearch} from "@welshman/app"
import {getSetting, userSettings} from "src/engine/state"
import {MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {MentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"

export const getUploadType = () => getSetting("upload_type")

export const getUploadUrl = () => {
  const {upload_type, nip96_urls, blossom_urls} = userSettings.get()

  return upload_type === "nip96"
    ? nip96_urls[0] || "https://nostr.build"
    : blossom_urls[0] || "https://cdn.satellite.earth"
}

export const signWithAssert = async (template: StampedEvent) => {
  const event = await signer.get().sign(template)

  return event!
}

export const removePendingUploads = (editor: Editor) => {
  editor.view.state.doc.descendants((node, pos) => {
    if (["image", "video"].includes(node.type.name) && node.attrs.uploading) {
      editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize))
    }
  })

  return true
}

export const removeFailedUploads = (editor: Editor) => {
  editor.view.state.doc.descendants((node, pos) => {
    if (["image", "video"].includes(node.type.name) && node.attrs.uploadError) {
      editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize))
    }
  })

  return true
}

export const makeEditor = ({
  aggressive = false,
  autofocus = false,
  charCount,
  content = "",
  placeholder = "",
  submit,
  uploading,
  onUploadError,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  charCount?: Writable<number>
  content?: string
  placeholder?: string
  submit: () => void
  uploading?: Writable<boolean>
  onUploadError?: (url: string, task: UploadTask) => void
  wordCount?: Writable<number>
}) =>
  new Editor({
    content,
    autofocus,
    extensions: [
      WelshmanExtension.configure({
        submit,
        sign: signWithAssert,
        defaultUploadType: getUploadType(),
        defaultUploadUrl: getUploadUrl(),
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
              onDrop() {
                uploading?.set(true)
              },
              onComplete() {
                uploading?.set(false)
              },
              onUploadError(currentEditor, task: UploadTask) {
                onUploadError?.(getUploadUrl(), task)
                removeFailedUploads(currentEditor)
                uploading?.set(false)
              },
            },
          },
          nprofile: {
            extend: {
              addNodeView: () => MentionNodeView,
              addProseMirrorPlugins() {
                return [
                  MentionSuggestion({
                    editor: (this as any).editor,
                    search: (term: string) => get(profileSearch).searchValues(term),
                    getRelays: (pubkey: string) => ctx.app.router.FromPubkeys([pubkey]).getUrls(),
                    createSuggestion: (value: string) => {
                      const target = document.createElement("div")

                      new ProfileSuggestion({target, props: {value}})

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
