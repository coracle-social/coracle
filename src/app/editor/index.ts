import "@welshman/editor/index.css"

import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import type {UploadTask} from "@welshman/editor"
import {first} from "@welshman/lib"
import type {StampedEvent} from "@welshman/util"
import {getTagValue, getListTags} from "@welshman/util"
import {Router} from "@welshman/router"
import {signer, profileSearch, userBlossomServers} from "@welshman/app"
import {Editor, MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {ensureProto} from "src/util/misc"
import {env} from "src/engine/state"
import {MentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"

export const getUploadUrl = () =>
  ensureProto(
    getTagValue("server", getListTags(userBlossomServers.get())) || first(env.BLOSSOM_URLS),
  )

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
        defaultUploadType: "blossom",
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
