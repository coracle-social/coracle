import "@welshman/editor/index.css"

import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import type {UploadTask, FileAttributes} from "@welshman/editor"
import {first} from "@welshman/lib"
import {BlossomServerLists} from "@welshman/app"
import {Editor, MentionSuggestion, WelshmanExtension, editorProps} from "@welshman/editor"
import {showWarning} from "src/partials/Toast.svelte"
import {ensureProto} from "src/util/misc"
import {app, appConfig, profiles, relayLists} from "src/engine/core"
import {env} from "src/engine/env"
import {uploadFile} from "src/engine/commands"
import {MentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"

const getUserBlossomServer = () => {
  const $app = app.get()

  return $app.user ? first($app.use(BlossomServerLists).urls($app.user.pubkey).get()) : undefined
}

export const makeEditor = ({
  aggressive = false,
  autofocus = false,
  content = "",
  encryptFiles = false,
  placeholder = "",
  submit,
  onUpdate,
  uploading,
  charCount,
  wordCount,
}: {
  aggressive?: boolean
  autofocus?: boolean
  content?: string
  // Only for composers whose event is itself encrypted, since the key comes back in the upload's
  // tags for the caller to publish alongside the url
  encryptFiles?: boolean
  placeholder?: string
  submit: () => void
  onUpdate?: () => void
  uploading?: Writable<boolean>
  charCount?: Writable<number>
  wordCount?: Writable<number>
}) =>
  new Editor({
    content,
    autofocus,
    editorProps,
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
                const server = ensureProto(getUserBlossomServer() || first(env.BLOSSOM_URLS))

                try {
                  let {uploaded, url, tags, error, ...task} = await uploadFile(server, attrs.file, {
                    encrypt: encryptFiles,
                  })

                  if (error || !uploaded) {
                    return {error: error || "Server refused to process the file"}
                  }

                  // Always append file extension if missing
                  if (new URL(url).pathname.split(".").length === 1) {
                    url += "." + attrs.file.type.split("/")[1]
                  }

                  const result = {...task, url, tags}

                  return {result}
                } catch (e) {
                  return {error: e.toString()}
                }
              },
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
                // The failed attachment is removed from the document, so saying nothing would just
                // make it disappear
                currentEditor.commands.removeFailedUploads()
                showWarning(`Failed to upload file: ${task.error}`)
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
                    search: (term: string) => get(profiles.get().profileSearch).searchValues(term),
                    getRelays: (pubkey: string) =>
                      relayLists.get().writeUrls(pubkey).get().slice(0, appConfig.relayLimit),
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
