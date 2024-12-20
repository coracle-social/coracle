import type {Writable} from "svelte/store"
import {createEditor} from "svelte-tiptap"
import type {StampedEvent} from "@welshman/util"
import {signer} from "@welshman/app"
import {getSetting, userSettings} from "src/engine/state"
import {WelshmanExtension} from "src/app/editor/extensions"
import "./index.css"

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

export const getEditor = ({
  aggressive = false,
  autofocus = false,
  charCount,
  content = "",
  element,
  placeholder = "",
  submit,
  uploading,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  charCount?: Writable<number>
  content?: string
  element: HTMLElement
  placeholder?: string
  submit: () => void
  uploading?: Writable<boolean>
  wordCount?: Writable<number>
}) =>
  createEditor({
    element,
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
