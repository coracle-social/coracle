import type {Writable} from "svelte/store"
import {derived} from "svelte/store"
import {createEditor, SvelteNodeViewRenderer} from "svelte-tiptap"
import {ctx} from "@welshman/lib"
import type {StampedEvent} from "@welshman/util"
import {signer, profileSearch} from "@welshman/app"
import {MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {getSetting, userSettingValues} from "@app/state"
import ProfileSuggestion from "./ProfileSuggestion.svelte"
import EditMention from "./EditMention.svelte"

export const getUploadType = () => getSetting<"nip96" | "blossom">("upload_type")

export const getUploadUrl = () => {
  const {upload_type, nip96_urls, blossom_urls} = userSettingValues.get()

  return upload_type === "nip96"
    ? nip96_urls[0] || "https://nostr.build"
    : blossom_urls[0] || "https://cdn.satellite.earth"
}

export const signWithAssert = async (template: StampedEvent) => {
  const event = await signer.get().sign(template)

  return event!
}

export const getEditor = ({
  autofocus = false,
  charCount,
  content = "",
  element,
  placeholder = "",
  submit,
  uploading,
  wordCount,
}: {
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
