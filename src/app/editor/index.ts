import {nprofileEncode} from "nostr-tools/nip19"
import {SvelteNodeViewRenderer} from "svelte-tiptap"
import Code from "@tiptap/extension-code"
import CodeBlock from "@tiptap/extension-code-block"
import Document from "@tiptap/extension-document"
import Dropcursor from "@tiptap/extension-dropcursor"
import Gapcursor from "@tiptap/extension-gapcursor"
import History from "@tiptap/extension-history"
import Placeholder from "@tiptap/extension-placeholder"
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
} from "nostr-editor"
import {ctx} from "@welshman/lib"
import type {StampedEvent} from "@welshman/util"
import {toNostrURI} from "@welshman/util"
import {signer, profileSearch, RelayMode} from "@welshman/app"
import {createSuggestions} from "./Suggestions"
import EditMention from "src/app/editor/EditMention.svelte"
import EditEvent from "src/app/editor/EditEvent.svelte"
import EditBolt11 from "src/app/editor/EditBolt11.svelte"
import EditMedia from "src/app/editor/EditMedia.svelte"
import Suggestions from "src/app/editor/Suggestions.svelte"
import SuggestionProfile from "src/app/editor/SuggestionProfile.svelte"
import {asInline} from "src/app/editor/util"
import {WordCount} from "src/app/editor/wordcounts"
import {FileUploadExtension} from "src/app/editor/FileUpload"
import {getSetting} from "src/engine"
import {Hashtag} from "src/app/editor/Hashtag"

export {createSuggestions, EditMention, EditEvent, EditBolt11, EditMedia, Suggestions}
export * from "./util"

type EditorOptions = {
  submit: () => void
  getPubkeyHints?: (pubkey: string) => string[]
  element?: HTMLElement
  submitOnEnter?: boolean
  submitOnModEnter?: boolean
  defaultUploadUrl?: string
  autofocus?: boolean
  content?: string
  placeholder?: string
  uploadType?: "nip96" | "blossom"
}

export type EditorImage = {
  src: string
  sha256: string
}

export const getEditorOptions = ({
  submit,
  getPubkeyHints = (pubkey: string) => ctx.app.router.getRelaysForPubkey(pubkey, RelayMode.Write),
  submitOnEnter = true,
  submitOnModEnter = false,
  element,
  defaultUploadUrl = getSetting("upload_type") === "nip96"
    ? getSetting("nip96_urls")[0] || "https://nostr.build"
    : getSetting("blossom_urls")[0] || "https://cdn.satellite.earth",
  uploadType = getSetting("upload_type"),
  autofocus = false,
  content = "",
  placeholder,
}: EditorOptions) => ({
  autofocus,
  element,
  content,
  extensions: [
    Code,
    CodeBlock,
    Document,
    Dropcursor,
    Gapcursor,
    History,
    Paragraph,
    Text,
    Hashtag,
    WordCount,
    Placeholder.configure({placeholder}),
    HardBreakExtension.extend({
      addKeyboardShortcuts() {
        return {
          "Shift-Enter": () => this.editor.commands.setHardBreak(),
          "Mod-Enter": () => {
            if (submitOnModEnter && this.editor.getText().trim()) {
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
            return false
          },
        }
      },
    }),
    Bolt11Extension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(EditBolt11)})),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(EditMention),
      renderText: props => toNostrURI(props.node.attrs.nprofile),
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
    NEventExtension.extend(
      asInline({
        addNodeView: () => SvelteNodeViewRenderer(EditEvent),
        renderText: props => toNostrURI(props.node.attrs.nevent),
      }),
    ),
    NAddrExtension.extend(
      asInline({
        addNodeView: () => SvelteNodeViewRenderer(EditEvent),
        renderText: props => toNostrURI(props.node.attrs.naddr),
      }),
    ),
    ImageExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(EditMedia)}),
    ).configure({defaultUploadUrl, defaultUploadType: uploadType}),
    VideoExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(EditMedia)}),
    ).configure({defaultUploadUrl, defaultUploadType: uploadType}),
    FileUploadExtension.configure({
      immediateUpload: true,
      sign: (event: StampedEvent) => {
        return signer.get()!.sign(event)
      },
      allowedMimeTypes: ["image/*", "video/*"],
    }),
  ],
})
