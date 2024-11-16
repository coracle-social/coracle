import {nprofileEncode} from "nostr-tools/nip19"
import {SvelteNodeViewRenderer} from "svelte-tiptap"
import Placeholder from "@tiptap/extension-placeholder"
import Code from "@tiptap/extension-code"
import CodeBlock from "@tiptap/extension-code-block"
import Document from "@tiptap/extension-document"
import Dropcursor from "@tiptap/extension-dropcursor"
import Gapcursor from "@tiptap/extension-gapcursor"
import History from "@tiptap/extension-history"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import HardBreakExtension from "@tiptap/extension-hard-break"
import {
  Bolt11Extension,
  NProfileExtension,
  NEventExtension,
  NAddrExtension,
  ImageExtension,
  VideoExtension,
  TagExtension,
} from "nostr-editor"
import type {StampedEvent} from "@welshman/util"
import {signer, profileSearch} from "@welshman/app"
import {FileUploadExtension} from "./FileUpload"
import {createSuggestions} from "./Suggestions"
import {LinkExtension} from "./LinkExtension"
import EditMention from "./EditMention.svelte"
import EditEvent from "./EditEvent.svelte"
import EditImage from "./EditImage.svelte"
import EditBolt11 from "./EditBolt11.svelte"
import EditVideo from "./EditVideo.svelte"
import EditLink from "./EditLink.svelte"
import Suggestions from "./Suggestions.svelte"
import SuggestionProfile from "./SuggestionProfile.svelte"
import {asInline} from "./util"
import {getSetting} from "@app/state"

export {
  createSuggestions,
  LinkExtension,
  EditMention,
  EditEvent,
  EditImage,
  EditBolt11,
  EditVideo,
  EditLink,
  Suggestions,
  SuggestionProfile,
}
export * from "./util"

type UploadType = "nip96" | "blossom"

type EditorOptions = {
  submit: () => void
  getPubkeyHints: (pubkey: string) => string[]
  submitOnEnter?: boolean
  placeholder?: string
  autofocus?: boolean
  uploadType?: UploadType
  defaultUploadUrl?: string
}

export const getEditorOptions = ({
  submit,
  getPubkeyHints,
  submitOnEnter,
  placeholder = "",
  autofocus = false,
  uploadType = getSetting("upload_type") as UploadType,
  defaultUploadUrl = getSetting("upload_type") == "nip96"
    ? (getSetting("nip96_urls") as string[])[0] || "https://nostr.build"
    : (getSetting("blossom_urls") as string[])[0] || "https://cdn.satellite.earth",
}: EditorOptions) => ({
  autofocus,
  content: "",
  extensions: [
    Code,
    CodeBlock,
    Document,
    Dropcursor,
    Gapcursor,
    History,
    Paragraph,
    Text,
    TagExtension,
    Placeholder.configure({placeholder}),
    HardBreakExtension.extend({
      addKeyboardShortcuts() {
        return {
          "Shift-Enter": () => this.editor.commands.setHardBreak(),
          "Mod-Enter": () => {
            if (this.editor.getText().trim()) {
              submit()
              return true
            }

            return this.editor.commands.setHardBreak()
          },
          Enter: () => {
            if (submitOnEnter && this.editor.getText().trim()) {
              submit()
              return true
            }

            return this.editor.commands.setHardBreak()
          },
        }
      },
    }),
    LinkExtension.extend({addNodeView: () => SvelteNodeViewRenderer(EditLink)}),
    Bolt11Extension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(EditBolt11)})),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(EditMention),
      addProseMirrorPlugins() {
        return [
          createSuggestions({
            char: "@",
            name: "nprofile",
            editor: this.editor,
            search: profileSearch,
            select: (pubkey: string, props: any) => {
              const relays = getPubkeyHints(pubkey)
              const nprofile = nprofileEncode({pubkey, relays})

              return props.command({pubkey, nprofile, relays})
            },
            suggestionComponent: SuggestionProfile,
            suggestionsComponent: Suggestions,
          }),
        ]
      },
    }),
    NEventExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(EditEvent)})),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(EditEvent)})),
    ImageExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(EditImage)}),
    ).configure({defaultUploadUrl, defaultUploadType: uploadType}),
    VideoExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(EditVideo)}),
    ).configure({defaultUploadUrl, defaultUploadType: uploadType}),
    FileUploadExtension.configure({
      immediateUpload: true,
      allowedMimeTypes: ["image/*", "video/*"],
      sign: (event: StampedEvent) => signer.get()!.sign(event),
    }),
  ],
})
