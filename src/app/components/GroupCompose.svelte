<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {nprofileEncode} from "nostr-tools/nip19"
  import {createEditor, type Editor, EditorContent, SvelteNodeViewRenderer} from "svelte-tiptap"
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
  import {createEvent, CHAT_MESSAGE} from "@welshman/util"
  import {LinkExtension, TopicExtension, createSuggestions, findNodes} from "@lib/tiptap"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
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
  import {
    searchProfiles,
    publishThunk,
    makeThunk,
    searchTopics,
    userRelayUrlsByNom,
  } from "@app/state"
  import {getPubkeyHints, makeMention, makeIMeta} from "@app/commands"

  export let nom

  let editor: Readable<Editor>
  let uploading = false

  const asInline = (extend: Record<string, any>) => ({inline: true, group: "inline", ...extend})

  const addFile = () => $editor.chain().selectFiles().run()

  const uploadFiles = () => $editor.chain().uploadFiles().run()

  const sendMessage = async () => {
    const json = $editor.getJSON()
    const relays = $userRelayUrlsByNom.get(nom)
    const event = createEvent(CHAT_MESSAGE, {
      content: $editor.getText(),
      tags: [
        ["h", nom],
        ...findNodes(TopicExtension.name, json).map(t => ["t", t.attrs!.name.toLowerCase()]),
        ...findNodes(NProfileExtension.name, json).map(m =>
          makeMention(m.attrs!.pubkey, m.attrs!.relays),
        ),
        ...findNodes(ImageExtension.name, json).map(({attrs: {src, sha256: x}}: any) =>
          makeIMeta(src, {x, ox: x}),
        ),
      ],
    })

    publishThunk(makeThunk({event, relays}))

    $editor.chain().clearContent().run()
  }

  onMount(() => {
    editor = createEditor({
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
                  uploadFiles()

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
        NAddrExtension.extend(
          asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)}),
        ),
        ImageExtension.extend(
          asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeImage)}),
        ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
        VideoExtension.extend(
          asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeVideo)}),
        ).configure({defaultUploadUrl: "https://nostr.build", defaultUploadType: "nip96"}),
        TopicExtension.extend({
          addNodeView: () => SvelteNodeViewRenderer(GroupComposeTopic),
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
            uploading = true

            return $signer!.sign(event)
          },
          onComplete: () => {
            uploading = false
            sendMessage()
          },
        }),
      ],
      content: "",
    })
  })
</script>

<div
  class="shadow-top-xl relative z-feature flex gap-2 border-t border-solid border-base-100 bg-base-100 p-2">
  <Button
    on:click={addFile}
    class="center h-10 w-10 rounded-box bg-base-300 transition-colors hover:bg-base-200">
    {#if uploading}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <Icon icon="gallery-send" />
    {/if}
  </Button>
  <div class="flex-grow">
    <EditorContent editor={$editor} />
  </div>
</div>
