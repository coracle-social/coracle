import cx from 'classnames'
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
  TagExtension as TopicExtension,
} from "nostr-editor"
import type {StampedEvent} from "@welshman/util"
import {LinkExtension, asInline, createSuggestions} from "@lib/tiptap"
import GroupComposeMention from "@app/components/GroupComposeMention.svelte"
import GroupComposeTopic from "@app/components/GroupComposeTopic.svelte"
import GroupComposeEvent from "@app/components/GroupComposeEvent.svelte"
import GroupComposeImage from "@app/components/GroupComposeImage.svelte"
import GroupComposeBolt11 from "@app/components/GroupComposeBolt11.svelte"
import GroupComposeVideo from "@app/components/GroupComposeVideo.svelte"
import GroupComposeLink from "@app/components/GroupComposeLink.svelte"
import GroupComposeSuggestions from "@app/components/GroupComposeSuggestions.svelte"
import GroupComposeTopicSuggestion from "@app/components/GroupComposeTopicSuggestion.svelte"
import GroupComposeProfileSuggestion from "@app/components/GroupComposeProfileSuggestion.svelte"
import {signer} from "@app/base"
import {searchProfiles, searchTopics} from "@app/state"
import {getPubkeyHints} from "@app/commands"

export const addFile = (editor: Editor) => editor.chain().selectFiles().run()

export const uploadFiles = (editor: Editor) => editor.chain().uploadFiles().run()

type ChatComposeEditorOptions = {
  uploading: Writable<boolean>
  sendMessage: () => void
}

export const getChatEditorOptions = ({uploading, sendMessage}: ChatComposeEditorOptions) => ({
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
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeLink),
    }),
    Bolt11Extension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeBolt11)}),
    ),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeMention),
      addProseMirrorPlugins() {
        return [
          createSuggestions({
            char: "@",
            name: "nprofile",
            editor: this.editor,
            search: searchProfiles,
            select: (pubkey: string, props: any) => {
              const relays = getPubkeyHints(pubkey)
              const nprofile = nprofileEncode({pubkey, relays})

              return props.command({pubkey, nprofile, relays})
            },
            suggestionComponent: GroupComposeProfileSuggestion,
            suggestionsComponent: GroupComposeSuggestions,
          }),
        ]
      },
    }),
    NEventExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)}),
    ),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)})),
    ImageExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeImage)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    VideoExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeVideo)}),
    ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
    TopicExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeTopic),
      renderHTML({mark, HTMLAttributes}) {
        const attrs = {
          ...mark.attrs,
          ...HTMLAttributes,
          target: '_blank',
          rel: 'noopener noreferer',
          href: `https://coracle.social/topics/${mark.attrs.tag.toLowerCase()}`,
          class: "underline",
        }

        return ['a', attrs, 0]
      },
      addProseMirrorPlugins() {
        return [
          createSuggestions({
            char: "#",
            name: "topic",
            editor: this.editor,
            search: searchTopics,
            select: (name: string, props: any) => props.command({name}),
            allowCreate: true,
            suggestionComponent: GroupComposeTopicSuggestion,
            suggestionsComponent: GroupComposeSuggestions,
          }),
        ]
      },
    }),
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
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeLink),
    }),
    Bolt11Extension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeBolt11)}),
    ),
    NProfileExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeMention),
    }),
    NEventExtension.extend(
      asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)}),
    ),
    NAddrExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)})),
    ImageExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeImage)})),
    VideoExtension.extend(asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeVideo)})),
    TopicExtension.extend({
      addNodeView: () => SvelteNodeViewRenderer(GroupComposeTopic),
    }),
  ],
})
