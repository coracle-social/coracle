<script lang="ts">
  import {onMount} from 'svelte'
  import type {Readable} from 'svelte/store'
  import {createEditor, type Editor, EditorContent, SvelteNodeViewRenderer} from 'svelte-tiptap'
  import {Extension} from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import HardBreakExtension from '@tiptap/extension-hard-break'
  import {NostrExtension} from 'nostr-editor'
  import type {StampedEvent} from '@welshman/util'
  import {createEvent, CHAT_MESSAGE} from '@welshman/util'
  import {LinkExtension, createSuggestions, findNodes} from '@lib/tiptap'
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'
  import GroupComposeMention from '@app/components/GroupComposeMention.svelte'
  import GroupComposeEvent from '@app/components/GroupComposeEvent.svelte'
  import GroupComposeImage from '@app/components/GroupComposeImage.svelte'
  import GroupComposeBolt11 from '@app/components/GroupComposeBolt11.svelte'
  import GroupComposeVideo from '@app/components/GroupComposeVideo.svelte'
  import GroupComposeLink from '@app/components/GroupComposeLink.svelte'
  import GroupComposeSuggestions from '@app/components/GroupComposeSuggestions.svelte'
  import GroupComposeTopicSuggestion from '@app/components/GroupComposeTopicSuggestion.svelte'
  import GroupComposeProfileSuggestion from '@app/components/GroupComposeProfileSuggestion.svelte'
  import {signer} from '@app/base'
  import {searchProfiles, searchTopics, displayProfileByPubkey} from '@app/state'

  let editor: Readable<Editor>
  let uploading = false

  const asInline = (extend: Record<string, any>) =>
    ({inline: true, group: 'inline', ...extend})

  const addFile = () => $editor.chain().selectFiles().run()

  const uploadFiles = () => $editor.chain().uploadFiles().run()

  const sendMessage = () => {
    console.log($editor.getJSON())
    console.log(findNodes($editor.getJSON(), 'mention'))
    console.log(findNodes($editor.getJSON(), 'nprofile'))
    console.log(findNodes($editor.getJSON(), 'nevent'))
    console.log(findNodes($editor.getJSON(), 'naddr'))
    console.log(findNodes($editor.getJSON(), 'image'))
    createEvent(CHAT_MESSAGE, {
      content: '',
      tags: [],
    })
  }

  onMount(() => {
    editor = createEditor({
      autofocus: true,
      extensions: [
        StarterKit.configure({
          blockquote: false,
          bold: false,
          bulletList: false,
          heading: false,
          horizontalRule: false,
          italic: false,
          listItem: false,
          orderedList: false,
          strike: false,
          hardBreak: false,
        }),
        HardBreakExtension.extend({
          addKeyboardShortcuts() {
            return {
              'Shift-Enter': () => this.editor.commands.setHardBreak(),
              'Mod-Enter': () => {
                uploadFiles()

                return true
              },
            }
          }
        }),
        LinkExtension.extend({
          addNodeView: () => SvelteNodeViewRenderer(GroupComposeLink),
        }),
        NostrExtension.configure({
          extend: {
            bolt11: asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeBolt11)}),
            nprofile: asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeMention)}),
            nevent: asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeEvent)}),
            naddr: asInline({addNodeView: () =>  SvelteNodeViewRenderer(GroupComposeEvent)}),
            image: asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeImage)}),
            video: asInline({addNodeView: () => SvelteNodeViewRenderer(GroupComposeVideo)}),
          },
          link: false,
          tweet: false,
          youtube: false,
          video: {defaultUploadUrl: 'https://nostr.build', defaultUploadType: 'nip96'},
          image: {defaultUploadUrl: 'https://nostr.build', defaultUploadType: 'nip96'},
          fileUpload: {
            immediateUpload: false,
            sign: (event: StampedEvent) => {
              uploading = true

              return $signer!.sign(event)
            },
            onComplete: () => {
              uploading = false
              sendMessage()
            },
          },
        }),
        createSuggestions('mention').configure({
          char: '@',
          search: searchProfiles,
          select: (pubkey: string, props: any) => props.command({pubkey}),
          suggestionComponent: GroupComposeProfileSuggestion,
          suggestionsComponent: GroupComposeSuggestions,
        }).extend({
          addAttributes: () => ({pubkey: {default: null}}),
          addNodeView: () => SvelteNodeViewRenderer(GroupComposeMention),
        }),
        createSuggestions('topic').configure({
          char: '#',
          search: searchTopics,
          select: (name: string, props: any) => props.command({name}),
          suggestionComponent: GroupComposeTopicSuggestion,
          suggestionsComponent: GroupComposeSuggestions,
        }).extend({
          addAttributes: () => ({name: {default: null}}),
          addNodeView: () => SvelteNodeViewRenderer(GroupComposeMention),
        }),
      ],
      content: '',
      onUpdate: () => {
        //  console.log('update', $editor.getJSON(), $editor.getText())
      },
    })
    console.log($editor)
  })
</script>

<div class="flex gap-2 relative z-feature border-t border-solid border-base-100 p-2 shadow-top-xl bg-neutral">
  <Button on:click={addFile} class="bg-base-300 rounded-box w-10 h-10 center">
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
