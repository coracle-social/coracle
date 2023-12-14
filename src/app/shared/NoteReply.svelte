<script lang="ts">
  import {Tags} from "paravel"
  import {createEventDispatcher} from "svelte"
  import {join, without, identity, uniq} from "ramda"
  import {getGroupAddress, asNostrEvent} from "src/util/nostr"
  import {slide} from "src/util/transition"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import {
    Publisher,
    buildReply,
    publishToZeroOrMoreGroups,
    session,
    getPublishHints,
    displayPubkey,
    mention,
  } from "src/engine"
  import {toastProgress} from "src/app/state"

  export let parent
  export let showBorder = false
  export let forceOpen = false

  const dispatch = createEventDispatcher()

  let images, compose, container, options
  let isOpen = false
  let mentions = []
  let draft = ""
  let opts = {
    warning: "",
    groups: parent.wrap ? Tags.from(parent).communities().all() : [],
    relays: getPublishHints(parent),
    shouldWrap: true,
    anonymous: false,
  }

  export const start = () => {
    dispatch("start")

    isOpen = true
    mentions = without(
      [$session.pubkey],
      uniq(Tags.from(parent).type("p").values().all().concat(parent.pubkey)),
    )

    setTimeout(() => compose.write(draft))
  }

  const setOpts = e => {
    opts = {...opts, ...e.detail}
  }

  const saveDraft = () => {
    if (compose) {
      draft = compose.parse()
    }
  }

  const clearDraft = () => {
    draft = ""
  }

  const reset = () => {
    dispatch("reset")

    isOpen = false
    compose = null
    mentions = []
  }

  const removeMention = pubkey => {
    mentions = without([pubkey], mentions)
  }

  const send = async () => {
    const content = compose.parse().trim()

    if (!content) {
      return
    }

    const tags = mentions.map(mention)

    for (const imeta of images.getValue()) {
      tags.push(["imeta", ...imeta.all().map(join(" "))])
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    // Re-broadcast the note we're replying to
    if (!parent.wrap) {
      Publisher.publish({relays: opts.relays, event: asNostrEvent(parent)})
    }

    const template = buildReply(parent, content, tags)
    const addresses = [getGroupAddress(parent)].filter(identity)
    const pubs = await publishToZeroOrMoreGroups(addresses, template, opts)

    pubs[0].on("progress", toastProgress)

    clearDraft()

    reset()
  }

  const onBodyClick = e => {
    const target = e.target as HTMLElement

    if (isOpen && container && !container.contains(target)) {
      saveDraft()
      reset()
    }
  }
</script>

<svelte:body on:click={onBodyClick} />

{#if isOpen || forceOpen}
  <div
    transition:slide|local
    class="note-reply relative z-feature my-2 flex flex-col gap-1"
    bind:this={container}
    on:click|stopPropagation>
    {#if showBorder}
      <div class="absolute bottom-0 left-4 top-0 z-none -my-2 w-px bg-cocoa" />
    {/if}
    <div class="z-feature overflow-hidden rounded">
      <div class="bg-cocoa p-3 text-lightest" class:rounded-b={mentions.length === 0}>
        <Compose bind:this={compose} onSubmit={send} style="min-height: 4rem">
          <div class="flex flex-col justify-start" slot="addon">
            <button
              on:click={send}
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent">
              <i class="fa fa-paper-plane" />
            </button>
          </div>
        </Compose>
      </div>
      <div class="bg-cocoa p-2">
        <NoteImages bind:this={images} bind:compose includeInContent />
      </div>
      <div class="h-px bg-cocoa" />
      <div class="flex gap-2 rounded-b bg-cocoa p-2 text-sm text-lightest">
        <div class="inline-block border-r border-solid border-mid py-2 pl-1 pr-3">
          <div class="flex cursor-pointer items-center gap-3">
            <ImageInput multi hostLimit={3} on:change={e => images.addImage(e.detail)}>
              <i slot="button" class="fa fa-paperclip" />
            </ImageInput>
            <i class="fa fa-cog" on:click={() => options.setView("settings")} />
            <i class="fa fa-at" />
          </div>
        </div>
        <div on:click|stopPropagation>
          {#each mentions as pubkey}
            <Chip class="mb-1 mr-1" theme="dark" onRemove={() => removeMention(pubkey)}>
              {displayPubkey(pubkey)}
            </Chip>
          {:else}
            <div class="text-lightest inline-block py-2">No mentions</div>
          {/each}
          <div class="-mb-2" />
        </div>
      </div>
    </div>
  </div>
{/if}

<NoteOptions
  bind:this={options}
  on:change={setOpts}
  initialValues={opts}
  hideFields={parent.wrap ? ["shouldWrap", "relays"] : []} />
