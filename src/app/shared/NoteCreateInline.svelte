<script lang="ts">
  import {writable, type Writable} from "svelte/store"
  import {ctx} from "@welshman/lib"
  import {createEvent} from "@welshman/util"
  import {pubkey, tagReplyTo} from "@welshman/app"
  import AltColor from "src/partials/AltColor.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {showPublishInfo, showWarning} from "src/partials/Toast.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import {getEditorOptions} from "src/app/editor"
  import {publish, getClientTags, tagsFromContent, signAndPublish} from "src/engine"
  import {onMount} from "svelte"
  import {Editor} from "svelte-tiptap"

  export let parent = null
  export let group = null

  let editorElement: HTMLElement
  let editor: Editor
  let editorLoading: Writable<boolean>

  const defaultOpts = {anonymous: false, warning: ""}

  let options, saving

  let opts = {...defaultOpts}

  const setOpts = e => {
    opts = {...opts, ...e.detail}
  }

  const nsecWarning = writable(null)

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    onSubmit({skipNsecWarning: true})
  }

  const onSubmit = async ({skipNsecWarning = false} = {}) => {
    if ($editorLoading) return

    saving = true

    const content = editor.getText().trim()

    if (!content) return showWarning("Please provide a description.")

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = [...tagsFromContent(content), ...getClientTags(), ...editor.commands.getMetaTags()]

    if (parent) {
      for (const tag of tagReplyTo(parent)) {
        tags.push(tag)
      }
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    // Re-broadcast the note we're replying to
    if (parent && !parent.wrap) {
      publish({event: parent, relays: ctx.app.router.PublishEvent(parent).getUrls()})
    }

    const template = createEvent(1, {content, tags})
    const pub = await signAndPublish(template, opts)

    showPublishInfo(pub)
    opts = {...defaultOpts}

    editor.commands.clearContent()
    saving = false
  }

  onMount(() => {
    const options = getEditorOptions({
      submit: onSubmit,
      element: editorElement,
      submitOnEnter: true,
      autofocus: true,
    })

    editor = new Editor(options)

    editorLoading = editor.storage.fileUpload.loading
  })
</script>

<form on:submit|preventDefault={() => onSubmit()}>
  <AltColor background class="z-feature flex gap-4 overflow-hidden rounded p-3 text-neutral-100">
    <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
    <div class="w-full min-w-0">
      <!-- placeholder="What's up?" -->
      <Compose bind:element={editorElement} {editor} style="min-height: 3em;" />
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-end gap-3">
          <i class="fa fa-cog cursor-pointer" on:click={() => options.setView("settings")} />
          <button
            class="hover:bg-white-l staatliches flex h-7 w-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
            on:click|preventDefault={editor.commands.selectFiles}>
            <i class="fa fa-paperclip cursor-pointer" />
          </button>
        </div>
        <Anchor button accent disabled={saving || $editorLoading} on:click={() => onSubmit({})}
          >Send</Anchor>
      </div>
    </div>
  </AltColor>
</form>

<NoteOptions on:change={setOpts} bind:this={options} initialValues={opts} />

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
