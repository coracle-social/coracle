<script lang="ts">
  import {ctx, without, uniq} from "@welshman/lib"
  import {NOTE, COMMENT, getPubkeyTagValues, createEvent, uniqTags} from "@welshman/util"
  import {
    session,
    displayProfileByPubkey,
    tagEventForReply,
    tagEventForComment,
  } from "@welshman/app"
  import {writable} from "svelte/store"
  import {slide} from "src/util/transition"
  import AltColor from "src/partials/AltColor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import {drafts} from "src/app/state"
  import {getClientTags, publish, sign, userSettings} from "src/engine"
  import {getEditor} from "src/app/editor"

  export let parent
  export let isOpen: boolean
  export let stopReply: () => void

  const nsecWarning = writable(null)
  const editorLoading = writable(false)

  $: mentions = without(
    [$session?.pubkey],
    uniq([parent.pubkey, ...getPubkeyTagValues(parent.tags)]),
  )

  let loading
  let showOptions = false
  let options = {warning: "", anonymous: false}
  let element: HTMLElement
  let editor: ReturnType<typeof getEditor>

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    send({skipNsecWarning: true})
  }

  const openOptions = () => {
    showOptions = true
  }

  const closeOptions = () => {
    showOptions = false
  }

  const setOptions = values => {
    options = {...options, ...values}
    showOptions = false
  }

  const saveDraft = () => {
    if ($editor) {
      drafts.set(parent.id, $editor.getHTML())
    }
  }

  const clearDraft = () => {
    drafts.delete(parent.id)
  }

  const removeMention = pubkey => {
    mentions = without([pubkey], mentions)
  }

  const send = async ({skipNsecWarning = false} = {}) => {
    if ($editorLoading) return

    saveDraft()

    const content = $editor.getText({blockSeparator: "\n"}).trim()

    if (!content) return

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const kind = parent.kind === NOTE ? NOTE : COMMENT
    const parentTags = kind === NOTE ? tagEventForReply(parent) : tagEventForComment(parent)
    const editorTags = $editor.storage.nostr.getEditorTags()
    const tags = uniqTags([...editorTags, ...parentTags, ...getClientTags()])

    if (options.warning) {
      tags.push(["content-warning", options.warning])
    }

    loading = true

    const template = createEvent(kind, {content, tags})
    const event = await sign(template, options)
    const thunk = publish({
      event,
      relays: ctx.app.router.PublishEvent(event).getUrls(),
      delay: $userSettings.send_delay,
    })

    stopReply()
    loading = false

    thunk.result.then(() => {
      clearDraft()
    })
  }

  const onBodyClick = e => {
    saveDraft()
    stopReply()
  }

  const createEditor = () => {
    editor = getEditor({
      element,
      submit: send,
      autofocus: true,
      content: drafts.get(parent.id) || "",
    })
  }

  $: {
    if (element) {
      createEditor()
    }
  }
</script>

<svelte:body on:click={onBodyClick} />

{#if isOpen}
  <div
    class="relative transition-colors"
    class:opacity-50={loading}
    class:pointer-events-none={loading}>
    <div transition:slide|local class="note-reply relative my-2 gap-1" on:click|stopPropagation>
      <AltColor background class="overflow-hidden rounded">
        <div class="p-3 text-neutral-100" class:rounded-b={mentions.length === 0}>
          <Compose bind:element editor={$editor}>
            <div class="flex flex-col justify-start" slot="addon">
              <button
                disabled={$editorLoading}
                class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all"
                class:hover:bg-accent={!$editorLoading}
                on:click={() => send()}>
                {#if loading || $editorLoading}
                  <i class="fa fa-circle-notch fa-spin" />
                {:else}
                  <i class="fa fa-paper-plane" />
                {/if}
              </button>
            </div>
          </Compose>
        </div>
        <div class="h-px" />
        <div class="flex gap-2 rounded-b p-2 text-sm text-neutral-100">
          <div class="flex border-r border-solid border-neutral-600 py-2 pl-1 pr-3">
            <div class="flex cursor-pointer items-center gap-3">
              <i
                class="fa fa-paperclip"
                on:click|preventDefault={() => $editor.chain().selectFiles().run()} />
              <i class="fa fa-cog" on:click|preventDefault={openOptions} />
            </div>
          </div>
          <div on:click|stopPropagation class="flex items-center">
            {#each mentions as pubkey}
              <Chip class="mb-1 mr-1" onRemove={() => removeMention(pubkey)}>
                {displayProfileByPubkey(pubkey)}
              </Chip>
            {:else}
              <div class="text-neutral-100 inline-block py-2">No mentions</div>
            {/each}
            <div class="-mb-2" />
          </div>
        </div>
      </AltColor>
    </div>
  </div>
{/if}

{#if showOptions}
  <NoteOptions onClose={closeOptions} onSubmit={setOptions} initialValues={options} />
{/if}

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
