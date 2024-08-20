<script lang="ts">
  import {onMount} from 'svelte'
  import type {Readable} from 'svelte/store'
  import {createEditor, type Editor, EditorContent, SvelteNodeViewRenderer} from 'svelte-tiptap'
  import StarterKit from '@tiptap/starter-kit'
  import {NostrExtension} from 'nostr-editor'
  import type {StampedEvent} from '@welshman/util'
  import {LinkExtension, Mention, Topic} from '@lib/tiptap'
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

  const asInline = (extend: Record<string, any>) =>
    ({inline: true, group: 'inline', ...extend})

  onMount(() => {
    editor = createEditor({
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
            sign: async (event: StampedEvent) => $signer!.sign(event),
            onDrop() {
              //  setPending(true)
            },
            onComplete(currentEditor: any) {
              console.log('Upload Completed', currentEditor.getText())
              //  setPending(false)
            },
          },
        }),
        Mention.configure(
          (() => {
            let suggestions: GroupComposeSuggestions

            const mapProps = (props: any) => ({
              term: props.query,
              select: (id: string) => props.command({id}),
              search: searchProfiles,
              component: GroupComposeProfileSuggestion,
            })

            return {
              getLabel: displayProfileByPubkey,
              tippyOptions: {arrow: false, theme: "transparent"},
              onStart: ({target, props}) => {
                suggestions = new GroupComposeSuggestions({target, props: mapProps(props)})
              },
              onUpdate: ({props}) => suggestions.$set(mapProps(props)),
              onKeyDown: ({event}) => suggestions.onKeyDown(event),
              onExit: () => suggestions.$destroy(),
            }
          })(),
        ),
        Topic.configure(
          (() => {
            let suggestions: GroupComposeSuggestions

            const mapProps = (props: any) => ({
              term: props.query,
              select: (id: string) => props.command({id}),
              search: searchTopics,
              component: GroupComposeTopicSuggestion,
            })

            return {
              tippyOptions: {arrow: false, theme: "transparent"},
              onStart: ({target, props}) => {
                suggestions = new GroupComposeSuggestions({target, props: mapProps(props)})
              },
              onUpdate: ({props}) => suggestions.$set(mapProps(props)),
              onKeyDown: ({event}) => suggestions.onKeyDown(event),
              onExit: () => suggestions.$destroy(),
            }
          })(),
        ),
      ],
      content: '',
      onUpdate: () => {
        //  console.log('update', $editor.getJSON(), $editor.getText())
      },
    })
  })
</script>

<div class="relative z-feature border-t border-solid border-base-100 p-2 shadow-top-xl">
  <EditorContent editor={$editor} />
</div>
