import {asClassComponent} from "svelte/legacy"
import type {Writable} from "svelte/store"
import {derived, readable} from "svelte/store"
import {Editor, SvelteNodeViewRenderer} from "svelte-tiptap"
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

export const makeEditor = ({
  aggressive = false,
  autofocus = false,
  charCount,
  content = "",
  placeholder = "",
  submit,
  uploading,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  charCount?: Writable<number>
  content?: string
  placeholder?: string
  submit: () => void
  uploading?: Writable<boolean>
  wordCount?: Writable<number>
}) => {
  let setter: (editor: Editor) => void

  const _editor = new Editor({
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
          nprofile: {
            extend: {
              addNodeView: () => SvelteNodeViewRenderer(asClassComponent(EditMention)),
              addProseMirrorPlugins() {
                return [
                  MentionSuggestion({
                    editor: (this as any).editor,
                    search: derived(profileSearch, s => s.searchValues),
                    getRelays: (pubkey: string) => ctx.app.router.FromPubkeys([pubkey]).getUrls(),
                    component: asClassComponent(ProfileSuggestion),
                  }),
                ]
              },
            },
          },
        },
      }),
    ],
    onUpdate({editor}) {
      setter?.(editor)
      wordCount?.set(editor.storage.wordCount.words)
      charCount?.set(editor.storage.wordCount.chars)
    },
  })

  return readable(_editor, set => {
    setter = set

    return () => _editor.destroy()
  })
}
