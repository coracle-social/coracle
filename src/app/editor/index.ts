import type {Writable} from "svelte/store"
import {derived} from "svelte/store"
import {createEditor, Editor, SvelteNodeViewRenderer} from "svelte-tiptap"
import {ctx} from "@welshman/lib"
import type {StampedEvent} from "@welshman/util"
import {signer, profileSearch} from "@welshman/app"
import {getSetting, userSettings} from "src/engine/state"
import {MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import ProfileSuggestion from "./ProfileSuggestion.svelte"
import EditMention from "./EditMention.svelte"

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

export const removeBlobs = (editor: Editor) => {
  editor.view.state.doc.descendants((node, pos) => {
    if (!(node.type.name === "image" || node.type.name === "video")) {
      return
    }
    if (node.attrs.src.startsWith("blob:")) {
      editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize))
    }
  })
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
  uploadError,
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
  uploadError?: Writable<string>
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
              onUploadError(currentEditor, file) {
                removeBlobs(currentEditor as Editor)
                uploadError?.set("Failed to upload file: " + file.uploadError)
                uploading?.set(false)
              },
            },
          },
          nprofile: {
            extend: {
              addNodeView: () => SvelteNodeViewRenderer(EditMention),
              addProseMirrorPlugins() {
                return [
                  MentionSuggestion({
                    editor: (this as any).editor,
                    search: derived(profileSearch, s => s.searchValues),
                    getRelays: (pubkey: string) => ctx.app.router.FromPubkeys([pubkey]).getUrls(),
                    component: ProfileSuggestion,
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
