<script lang="ts">
  import {writable} from "@coracle.social/lib"
  import {Tags, createEvent} from "@coracle.social/util"
  import {createEventDispatcher} from "svelte"
  import {join, without, uniq} from "ramda"
  import {slide} from "src/util/transition"
  import ImageInput from "src/partials/ImageInput.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
  import NoteImages from "src/app/shared/NoteImages.svelte"
  import {
    env,
    Publisher,
    uniqTags,
    publishToZeroOrMoreGroups,
    tagsFromContent,
    getClientTags,
    getReplyTags,
    session,
    displayPubkey,
    mention,
  } from "src/engine"
  import {toastProgress} from "src/app/state"

  export let parent
  export let addToContext
  export let showBorder = false
  export let forceOpen = false

  const dispatch = createEventDispatcher()
  const nsecWarning = writable(null)
  const parentTags = Tags.fromEvent(parent)

  let images, compose, container, options
  let isOpen = false
  let mentions = []
  let draft = ""
  let opts = {warning: "", anonymous: false}

  export const start = () => {
    dispatch("start")

    isOpen = true
    mentions = without(
      [$session.pubkey],
      uniq(parentTags.values("p").valueOf().concat(parent.pubkey)),
    )

    setTimeout(() => compose.write(draft), 10)
  }

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    send({skipNsecWarning: true})
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

  const send = async ({skipNsecWarning = false} = {}) => {
    const content = compose.parse().trim()

    if (!content) return

    if (!skipNsecWarning && content.match(/\bnsec1.+/)) return nsecWarning.set(true)

    const tags = uniqTags([
      ...mentions.map(mention),
      ...getReplyTags(parent, true),
      ...tagsFromContent(content),
      ...getClientTags(),
    ])

    for (const imeta of images.getValue()) {
      tags.push(["imeta", ...imeta.unwrap().map(join(" "))])
    }

    if (opts.warning) {
      tags.push(["content-warning", opts.warning])
    }

    // Re-broadcast the note we're replying to
    if (!parent.wrap) {
      Publisher.publish({event: parent})
    }

    const template = createEvent(1, {content, tags})
    const addresses = parentTags.context().values().valueOf()
    const {pubs, events} = await publishToZeroOrMoreGroups(addresses, template, opts)

    pubs[0].on("progress", toastProgress)

    addToContext(events[0])

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
  <div class="relative">
    {#if showBorder}
      <AltColor background class="absolute -top-4 z-none h-5 w-1" />
    {/if}
    <div
      transition:slide|local
      class="note-reply relative z-feature my-2 flex flex-col gap-1"
      bind:this={container}
      on:click|stopPropagation>
      <AltColor background class="z-feature overflow-hidden rounded">
        <div class="p-3 text-neutral-100" class:rounded-b={mentions.length === 0}>
          <Compose autofocus bind:this={compose} onSubmit={() => send()} style="min-height: 4rem">
            <div class="flex flex-col justify-start" slot="addon">
              <button
                on:click={() => send()}
                class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent">
                <i class="fa fa-paper-plane" />
              </button>
            </div>
          </Compose>
        </div>
        <div class="p-2">
          <NoteImages bind:this={images} bind:compose includeInContent />
        </div>
        <div class="h-px" />
        <div class="flex gap-2 rounded-b p-2 text-sm text-neutral-100">
          <div class="inline-block border-r border-solid border-neutral-600 py-2 pl-1 pr-3">
            <div class="flex cursor-pointer items-center gap-3">
              <ImageInput multi hostLimit={3} on:change={e => images.addImage(e.detail)}>
                <i slot="button" class="fa fa-paperclip" />
              </ImageInput>
              {#if !$env.FORCE_GROUP}
                <i class="fa fa-cog" on:click={() => options.setView("settings")} />
              {/if}
              <i class="fa fa-at" />
            </div>
          </div>
          <div on:click|stopPropagation>
            {#each mentions as pubkey}
              <Chip class="mb-1 mr-1" onRemove={() => removeMention(pubkey)}>
                {displayPubkey(pubkey)}
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

{#if !$env.FORCE_GROUP}
  <NoteOptions
    bind:this={options}
    on:change={setOpts}
    initialValues={opts}
    hideFields={["groups"]} />
{/if}

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
