import {mount} from "svelte"
import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import type {StampedEvent} from "@welshman/util"
import {Router} from "@welshman/router"
import {signer, profileSearch} from "@welshman/app"
import {Editor, MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {getSetting, userSettingValues} from "@app/state"
import {makeMentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"

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
}) =>
  new Editor({
    content,
    autofocus,
    element: document.createElement("div"),
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
