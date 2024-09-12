import type {Writable} from "svelte/store"
import {nprofileEncode} from "nostr-tools/nip19"
import {SvelteNodeViewRenderer} from "svelte-tiptap"
import {Editor} from "@tiptap/core"
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
  FileUploadExtension,
} from "nostr-editor"
import type {StampedEvent} from "@welshman/util"
import {signer, profileSearch} from "@welshman/app"
import {LinkExtension, asInline, createSuggestions} from "@lib/tiptap"
import ChatComposeMention from "@app/components/ChatComposeMention.svelte"
import ChatComposeEvent from "@app/components/ChatComposeEvent.svelte"
import ChatComposeImage from "@app/components/ChatComposeImage.svelte"
import ChatComposeBolt11 from "@app/components/ChatComposeBolt11.svelte"
import ChatComposeVideo from "@app/components/ChatComposeVideo.svelte"
import ChatComposeLink from "@app/components/ChatComposeLink.svelte"
import ChatComposeSuggestions from "@app/components/ChatComposeSuggestions.svelte"
import ChatSuggestionProfile from "@app/components/ChatSuggestionProfile.svelte"
import {getPubkeyHints} from "@app/commands"

export const addFile = (editor: Editor) => editor.chain().selectFiles().run()

export const uploadFiles = (editor: Editor) => editor.chain().uploadFiles().run()

type EditorOptions = {
  uploading: Writable<boolean>
  sendMessage: () => void
}

export const getChatEditorOptions = ({uploading, sendMessage}: EditorOptions) => ({
  content: "",
  autofocus: true,
  extensions: [
    Code,
    CodeBlock,
    Document,
    Dropcursor,
    Gapcursor,
    History,
    Paragraph,
    Text,
    HardBreakExtension.extend({
      addKeyboardShortcuts() {
        return {
          "Shift-Enter": () => this.editor.commands.setHardBreak(),
          "Mod-Enter": () => this.editor.commands.setHardBreak(),
          Enter: () => {
            if (this.editor.getText().trim()) {
              uploadFiles(this.editor)

              return true
            }

            return false
          },
        }
      },
    }),
    LinkExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeLink),
    }),
    Bolt11Extension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeBolt11)}),
    ),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeMention),
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
            suggestionComponent: ChatSuggestionProfile,
            suggestionsComponent: ChatComposeSuggestions,
          }),
        ]
      },
    }),
    NEventExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    ImageExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeImage)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    VideoExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeVideo)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    FileUploadExtension.configure({
      immediateUpload: false,
      sign: (event: StampedEvent) => {
        uploading.set(true)

        return signer.get()!.sign(event)
      },
      onComplete: () => {
        uploading.set(false)
        sendMessage()
      },
    }),
  ],
})

export const getChatViewOptions = (content: string) => ({
  content,
  editable: false,
  shouldRerenderOnTransaction: false,
  extensions: [
    Code,
    CodeBlock,
    Document,
    Paragraph,
    Text,
    LinkExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeLink),
    }),
    Bolt11Extension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeBolt11)}),
    ),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeMention),
    }),
    NEventExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    ImageExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeImage)})),
    VideoExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeVideo)})),
  ],
})

export const getNoteEditorOptions = ({uploading, sendMessage}: EditorOptions) => ({
  content: "",
  extensions: [
    Document,
    Dropcursor,
    Gapcursor,
    History,
    Paragraph,
    Text,
    HardBreakExtension,
    LinkExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeLink),
    }),
    Bolt11Extension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeBolt11)}),
    ),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(ChatComposeMention),
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
            suggestionComponent: ChatSuggestionProfile,
            suggestionsComponent: ChatComposeSuggestions,
          }),
        ]
      },
    }),
    NEventExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeEvent)})),
    ImageExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeImage)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    VideoExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(ChatComposeVideo)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    FileUploadExtension.configure({
      immediateUpload: false,
      sign: (event: StampedEvent) => {
        uploading.set(true)

        return signer.get()!.sign(event)
      },
      onComplete: () => {
        uploading.set(false)
        sendMessage()
      },
    }),
  ],
})
