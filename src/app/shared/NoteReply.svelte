<script lang="ts">
  import {Tags} from "paravel"
  import {createEventDispatcher} from "svelte"
  import {without, identity, uniq} from "ramda"
  import {getGroupAddress, asNostrEvent} from "src/util/nostr"
  import {slide} from "src/util/transition"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Media from "src/partials/Media.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import NoteOptions from "src/app/shared/NoteOptions.svelte"
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
  export let showBorder

  const dispatch = createEventDispatcher()

  let data = null
  let reply = null
  let container = null
  let draft = ""
  let options
  let opts = {
    warning: "",
    groups: parent.wrap ? Tags.from(parent).communities().all() : [],
    relays: getPublishHints(parent),
    shouldWrap: true,
    anonymous: false,
  }

  export const start = () => {
    dispatch("start")

    data = {
      image: null,
      mentions: without(
        [$session.pubkey],
        uniq(Tags.from(parent).type("p").values().all().concat(parent.pubkey))
      ),
    }

    setTimeout(() => reply.write(draft))
  }

  const setOpts = e => {
    opts = {...opts, ...e.detail}
  }

  const saveDraft = () => {
    if (reply) {
      draft = reply.parse()
    }
  }

  const clearDraft = () => {
    draft = ""
  }

  const reset = () => {
    dispatch("reset")

    data = null
    reply = null
  }

  const removeMention = pubkey => {
    data.mentions = without([pubkey], data.mentions)
  }

  const getContent = () => (reply.parse() + "\n" + (data.image || "")).trim()

  const send = async () => {
    const content = getContent()

    if (!content) {
      return
    }

    const tags = data.mentions.map(mention)

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

    if (container && !container.contains(target)) {
      saveDraft()
      reset()
    }
  }
</script>

<svelte:body on:click={onBodyClick} />

{#if data}
  <div
    transition:slide|local
    class="note-reply relative z-10 my-2 flex flex-col gap-1"
    bind:this={container}
    on:click|stopPropagation>
    {#if showBorder}
      <div class="absolute bottom-0 left-4 top-0 z-0 -my-2 w-px bg-gray-6" />
    {/if}
    <div class="z-10 overflow-hidden rounded-2xl border border-solid border-gray-6">
      <div class="bg-gray-7 p-3 text-gray-2" class:rounded-b={data.mentions.length === 0}>
        <Compose bind:this={reply} onSubmit={send} style="min-height: 4rem">
          <div class="flex flex-col justify-start" slot="addon">
            <button
              on:click={send}
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent">
              <i class="fa fa-paper-plane" />
            </button>
          </div>
        </Compose>
      </div>
      {#if data.image}
        <div class="bg-gray-7 p-2">
          <Media
            link={{type: "image", url: data.image}}
            onClose={() => {
              data.image = null
            }} />
        </div>
      {/if}
      <div class="h-px bg-gray-7 group-[.modal]:bg-gray-6" />
      <div class="flex gap-2 rounded-b bg-gray-7 p-2 text-sm text-gray-2">
        <div class="inline-block border-r border-solid border-gray-6 py-2 pl-1 pr-3">
          <div class="flex cursor-pointer items-center gap-3">
            <ImageInput bind:value={data.image}>
              <i slot="button" class="fa fa-paperclip" />
            </ImageInput>
            <i class="fa fa-cog" on:click={() => options.setView("settings")} />
            <i class="fa fa-at" />
          </div>
        </div>
        <div on:click|stopPropagation>
          {#each data.mentions as pubkey}
            <Chip class="mb-1 mr-1" theme="dark" onRemove={() => removeMention(pubkey)}>
              {displayPubkey(pubkey)}
            </Chip>
          {:else}
            <div class="text-gray-2 inline-block py-2">No mentions</div>
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
  showRelays={!parent.wrap} />
