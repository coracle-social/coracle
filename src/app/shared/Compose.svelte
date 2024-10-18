<style>
  :global(.lazy-image) {
    animation: blurPulse 1.5s infinite;
  }

  :global(a[data-type="tag"]) {
    text-decoration: underline;
  }

  @keyframes blurPulse {
    0% {
      filter: blur(0px);
    }
    50% {
      filter: blur(15px);
    }
    100% {
      filter: blur(0px);
    }
  }
</style>

<script lang="ts">
  import {nip19} from "nostr-tools"
  import {throttle} from "throttle-debounce"
  import {createEventDispatcher, onMount} from "svelte"
  import {ctx, last, partition} from "@welshman/lib"
  import {profileSearch} from "@welshman/app"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"
  import {userFollows, createPeopleLoader, getSetting} from "src/engine"
  import type {Readable} from "svelte/store"
  import {createEditor, Editor, SvelteNodeViewRenderer} from "svelte-tiptap"
  import StarterKit from "@tiptap/starter-kit"
  import {NostrExtension} from "nostr-editor"
  import {signer} from "@welshman/app"
  import PersonLink from "src/app/shared/PersonLink.svelte"

  export let onSubmit
  export let autofocus = false
  export let placeholder = null
  export let hostLimit = 1

  let editor: Readable<Editor>

  let suggestions

  let element: HTMLDivElement

  $: textBeforeCursor = $editor?.state?.selection?.$anchor?.nodeBefore?.text || ""

  onMount(() => {
    const urls = getSetting("nip96_urls").slice(0, hostLimit)
    editor = createEditor({
      autofocus,

      element: element,
      editorProps: {
        attributes: {
          placeholder,
        },
      },

      extensions: [
        StarterKit,
        NostrExtension.configure({
          extend: {
            nprofile: {addNodeView: () => SvelteNodeViewRenderer(PersonLink)},
          },
          tag: true,
          image: {
            defaultUploadUrl: urls[0],
            defaultUploadType: "nip96",
          },
          video: {
            defaultUploadUrl: urls[0],
            defaultUploadType: "nip96",
          },
          fileUpload: {
            immediateUpload: true,
            sign: async event => {
              return $signer.sign(event)
            },
            onDrop() {
              const imgElements = element.querySelectorAll('img[uploading="true"]')
              for (const img of imgElements) {
                img.classList.add("lazy-image")
              }
            },
          },
          link: {autolink: true},
        }),
      ],
      content: "",
    })
  })

  const dispatch = createEventDispatcher()

  const {loading: loadingPeople, load: loadPeople} = createPeopleLoader({
    shouldLoad: (term: string) => term.startsWith("@"),
    onEvent: () => applySearch(getLastWord()),
  })

  const pubkeyEncoder = {
    encode: pubkey => {
      const relays = ctx.app.router.FromPubkeys([pubkey]).getUrls()
      const nprofile = nip19.nprofileEncode({pubkey, relays})

      return "nostr:" + nprofile
    },
    decode: link => {
      // @ts-ignore
      return nip19.decode(last(link.split(":"))).data.pubkey
    },
  }

  const applySearch = throttle(300, (word: string) => {
    let results = []
    if (word.length > 1 && word.startsWith("@")) {
      const [followed, notFollowed] = partition(
        pubkey => $userFollows.has(pubkey),
        $profileSearch.searchValues(word.slice(1)),
      )

      results = followed.concat(notFollowed)
    }

    suggestions.setData(results)
  })

  const getLastWord = () => {
    const word = last(textBeforeCursor.trim().split(/\s+/))
    return word || ""
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
      return onSubmit()
    }

    // Don't close a modal, submit the form, or lose focus
    if (["Escape", "Tab"].includes(e.code)) {
      e.preventDefault()
      e.stopPropagation()
    }

    // If we have suggestions, re-route keyboard commands
    if (["Enter", "ArrowUp", "ArrowDown"].includes(e.code) && suggestions.get()) {
      e.preventDefault()
    }

    // Enter adds a newline, so do it on key down
    if (["Enter"].includes(e.code) && suggestions.get()) {
      e.preventDefault()
      const pubkey = suggestions.get()
      if (pubkey) {
        const content = $editor.getHTML()
        // only replace the last occurence
        const replacedContent = content.replace(/(.*)@\w+/, "$1")
        $editor.commands.setContent(replacedContent, true)
        $editor.commands.insertNProfile({nprofile: pubkeyEncoder.encode(pubkey)})
        suggestions.setData([])
      }
    }
  }

  const onKeyUp = e => {
    const word = getLastWord()

    // Populate search data
    loadPeople(word)
    applySearch(word)

    if (["Tab"].includes(e.code) && suggestions.get()) {
      e.preventDefault()
      const pubkey = suggestions.get()
      if (pubkey) {
        const content = $editor.getHTML()
        // only replace the last occurence
        const replacedContent = content.replace(/(.*)@\w+/, "$1")
        $editor.commands.setContent(replacedContent, true)
        $editor.commands.insertNProfile({nprofile: pubkeyEncoder.encode(pubkey)})
        suggestions.setData([])
      }
    }

    if (["Escape", "Space"].includes(e.code)) {
      suggestions.clear()
    }

    if (e.code === "ArrowUp") {
      suggestions.prev()
    }

    if (e.code === "ArrowDown") {
      suggestions.next()
    }

    dispatch("keyup", e)
  }

  export const mention = pubkey => {
    $editor.commands.insertNProfile({nprofile: pubkeyEncoder.encode(pubkey)})
  }

  export const clear = () => {}

  export const nevent = text => {
    $editor.commands.insertNEvent(text)
  }

  export const write = text => {
    $editor.commands.insertContent(text)
  }

  export const selectFiles = () => {
    $editor.commands.selectFiles()
  }

  export const parse = () => {
    return $editor.getText()
  }
</script>

<div class="flex w-full">
  <div
    bind:this={element}
    style={$$props.style}
    class="w-full"
    on:keydown={onKeyDown}
    on:keyup={onKeyUp} />
  <slot name="addon" />
</div>

<Suggestions
  bind:this={suggestions}
  select={pubkey => {
    const content = $editor.getHTML()
    // only replace the last occurence
    const replacedContent = content.replace(/(.*)@\w+/, "$1")
    $editor.commands.setContent(replacedContent, true)
    $editor.commands.insertNProfile({nprofile: pubkeyEncoder.encode(pubkey)})
    suggestions.setData([])
  }}
  loading={$loadingPeople}>
  <div slot="item" let:item>
    <PersonBadge inert pubkey={item} />
  </div>
</Suggestions>
