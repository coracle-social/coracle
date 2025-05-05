import {mount} from "svelte"
import type {Writable} from "svelte/store"
import {get} from "svelte/store"
import type {StampedEvent} from "@welshman/util"
import {makeEvent, getTagValues, getListTags, BLOSSOM_AUTH} from "@welshman/util"
import {simpleCache, normalizeUrl, removeNil, now} from "@welshman/lib"
import {Router} from "@welshman/router"
import {signer, profileSearch, userBlossomServers} from "@welshman/app"
import {Editor, MentionSuggestion, WelshmanExtension} from "@welshman/editor"
import {makeMentionNodeView} from "./MentionNodeView"
import ProfileSuggestion from "./ProfileSuggestion.svelte"

export const hasBlossomSupport = simpleCache(async ([url]: [string]) => {
  try {
    const event = await signer.get()!.sign(
      makeEvent(BLOSSOM_AUTH, {
        tags: [
          ["t", "upload"],
          ["server", url],
          ["expiration", String(now() + 30)],
        ],
      }),
    )

    const res = await fetch(normalizeUrl(url) + "/upload", {
      method: "head",
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
        "X-Content-Type": "text/plain",
        "X-Content-Length": "1",
        "X-SHA-256": "73cb3858a687a8494ca3323053016282f3dad39d42cf62ca4e79dda2aac7d9ac",
      },
    })

    return res.status === 200
  } catch (e) {
    if (!String(e).includes("Failed to fetch")) {
      console.error(e)
    }
  }
})

export const getUploadUrl = async (spaceUrl?: string) => {
  const userUrls = getTagValues("server", getListTags(userBlossomServers.get()))
  const allUrls = removeNil([spaceUrl, ...userUrls])

  for (let url of allUrls) {
    url = url.replace(/^ws/, "http")

    if (await hasBlossomSupport(url)) {
      return url
    }
  }

  return "https://cdn.satellite.earth"
}

export const signWithAssert = async (template: StampedEvent) => {
  const event = await signer.get().sign(template)

  return event!
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
  disableFileUpload,
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
  disableFileUpload?: boolean
}) => {
  return new Editor({
    content,
    autofocus,
    element: document.createElement("div"),
    extensions: [
      WelshmanExtension.configure({
        submit,
        sign: signWithAssert,
        defaultUploadType: "blossom",
        defaultUploadUrl: await getUploadUrl(url),
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
          fileUpload: disableFileUpload
            ? false
            : {
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
}
