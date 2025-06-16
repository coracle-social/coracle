<script lang="ts">
  import {onDestroy} from "svelte"
  import {without, uniq, now} from "@welshman/lib"
  import {NOTE, COMMENT, getPubkeyTagValues, makeEvent, uniqTags} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {
    session,
    displayProfileByPubkey,
    tagEventForReply,
    tagEventForComment,
    publishThunk,
  } from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {own, hash} from "@welshman/signer"
  import {writable} from "svelte/store"
  import {makePow} from "src/util/pow"
  import type {ProofOfWork} from "src/util/pow"
  import {slide} from "src/util/transition"
  import {showWarning} from "src/partials/Toast.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import type {Values} from "src/app/shared/NoteOptions.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import {drafts} from "src/app/state"
  import {getClientTags, sign, userSettings} from "src/engine"
  import {makeEditor} from "src/app/editor"

  export let parent
  export let replyIsOpen: boolean
  export let onReplyCancel: () => void
  export let onReplyPublish: (thunk: Thunk) => void

  const nsecWarning = writable(null)
  const uploading = writable(false)

  $: mentions = without(
    [$session?.pubkey],
    uniq([parent.pubkey, ...getPubkeyTagValues(parent.tags)]),
  )

  let loading
  let pow: ProofOfWork
  let showOptions = false
  let options: Values = {
    warning: "",
    anonymous: false,
    pow_difficulty: $userSettings.pow_difficulty,
  }

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
    $uploading = false
    editor.commands.removePendingUploads()
    drafts.set(parent.id, editor.getJSON())
  }

  const clearDraft = () => {
    editor.commands.setContent("")
    drafts.delete(parent.id)
  }

  const removeMention = pubkey => {
    mentions = without([pubkey], mentions)
  }

  const send = async ({skipNsecWarning = false} = {}) => {
    if ($uploading) return

    const content = editor.getText({blockSeparator: "\n"}).trim()

    if (!content) return

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const kind = parent.kind === NOTE ? NOTE : COMMENT
    const parentTags = kind === NOTE ? tagEventForReply(parent) : tagEventForComment(parent)
    const editorTags = editor.storage.nostr.getEditorTags()
    const tags = uniqTags([...editorTags, ...parentTags, ...getClientTags()])

    if (options.warning) {
      tags.push(["content-warning", options.warning])
    }

    loading = true
    clearDraft()

    const ownedEvent = own(makeEvent(kind, {content, tags, created_at: now()}), $session.pubkey)

    let hashedEvent = hash(ownedEvent)

    if (options.pow_difficulty) {
      pow?.worker.terminate()
      pow = makePow(ownedEvent, options.pow_difficulty)

      hashedEvent = await pow.result
    }

    const relays =
      options.relays?.length > 0
        ? options.relays
        : Router.get().PublishEvent(hashedEvent).policy(addMaximalFallbacks).getUrls()

    const thunk = publishThunk({
      relays,
      event: await sign(hashedEvent, options),
      delay: $userSettings.send_delay,
    })

    loading = false
    onReplyPublish(thunk)
  }

  const onBodyClick = e => {
    if (replyIsOpen) {
      saveDraft()
      onReplyCancel()
    }
  }

  const editor = makeEditor({
    uploading,
    submit: send,
    autofocus: true,
    content: drafts.get(parent.id) || "",
    onUploadError: task => showWarning(`Failed to upload file: ${task.error}`),
  })

  onDestroy(() => {
    pow?.worker.terminate()
    editor.destroy()
  })
</script>

<svelte:body on:click={onBodyClick} />

{#if replyIsOpen}
  <div
    class="relative transition-colors"
    class:opacity-50={loading}
    class:pointer-events-none={loading}>
    <div transition:slide|local class="note-reply relative mt-2 gap-1" on:click|stopPropagation>
      <AltColor background class="overflow-hidden rounded">
        <div class="p-3 text-neutral-100" class:rounded-b={mentions.length === 0}>
          <EditorContent doNotDestroy {editor}>
            <div class="z-feature flex flex-col justify-start" slot="addon">
              <button
                disabled={$uploading}
                class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all"
                class:hover:bg-accent={!$uploading}
                on:click={() => send()}>
                {#if loading || $uploading}
                  <i class="fa fa-circle-notch fa-spin" />
                {:else}
                  <i class="fa fa-paper-plane" />
                {/if}
              </button>
            </div>
          </EditorContent>
        </div>
        <div class="h-px" />
        <div class="flex gap-2 rounded-b p-2 text-sm text-neutral-100">
          <div class="flex border-r border-solid border-neutral-600 py-2 pl-1 pr-3">
            <div class="flex cursor-pointer items-center gap-3">
              <i
                class="fa fa-paperclip"
                on:click|preventDefault={() => editor.chain().selectFiles().run()} />
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
