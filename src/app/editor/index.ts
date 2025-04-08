import "@welshman/editor/index.css"

import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import type {UploadTask} from "@welshman/editor"
import type {StampedEvent} from "@welshman/util"
import {signer, Router, profileSearch} from "@welshman/app"
import {Editor, MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {getSetting, userSettings} from "src/engine/state"
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

export const makeEditor = ({
  aggressive = false,
  autofocus = false,
  content = "",
  placeholder = "",
  submit,
  onUpdate,
  onUploadError,
  uploading,
  charCount,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  content?: string
  placeholder?: string
  submit: () => void
  onUpdate?: () => void
  onUploadError?: (url: string, task: UploadTask) => void
  uploading?: Writable<boolean>
  charCount?: Writable<number>
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
              onDrop(currentEditor, file: File) {
                uploading?.set(true)
                setTimeout(() => {
                  const files = currentEditor.storage.fileUpload.getFiles()

                  // Hack to fix bug with immediateUpload
                  if (files.some(f => f.src.startsWith("blob:") && !f.uploading)) {
                    currentEditor.commands.uploadFiles()
                  }
                })
              },
              onComplete() {
                uploading?.set(false)
              },
              onUploadError(currentEditor, task: UploadTask) {
                currentEditor.commands.removeFailedUploads()
                onUploadError?.(getUploadUrl(), task)
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
                    getRelays: (pubkey: string) => Router.get().FromPubkey(pubkey).getUrls(),
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
      onUpdate?.()
      wordCount?.set(editor.storage.wordCount.words)
      charCount?.set(editor.storage.wordCount.chars)
    },
  })
