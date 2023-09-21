<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {without, uniq} from "ramda"
  import {slide} from "src/util/transition"
  import {Tags} from "src/util/nostr"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Media from "src/partials/Media.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import {publishReply, session, displayPubkey, mention} from "src/engine"
  import {toastProgress} from "src/app/state"

  export let parent
  export let borderColor

  const dispatch = createEventDispatcher()

  let data = null
  let reply = null
  let container = null

  export const start = () => {
    dispatch("start")

    data = {
      image: null,
      mentions: without(
        [$session.pubkey],
        uniq(Tags.from(parent).type("p").values().all().concat(parent.pubkey))
      ),
    }
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
    const tags = data.mentions.map(mention)

    if (content) {
      const pub = await publishReply(parent, content, tags)

      pub.on("progress", toastProgress)

      reset()
    }
  }

  const onBodyClick = e => {
    const target = e.target as HTMLElement

    if (container && !container.contains(target)) {
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
    <div class={`border border-${borderColor} overflow-hidden rounded-2xl border-solid`}>
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
      <div class={`h-px bg-${borderColor}`} />
      <div class="flex gap-2 rounded-b bg-gray-7 p-2 text-sm text-gray-2">
        <div class="inline-block border-r border-solid border-gray-6 py-2 pl-1 pr-3">
          <div class="flex cursor-pointer items-center gap-3">
            <ImageInput bind:value={data.image}>
              <i slot="button" class="fa fa-paperclip" />
            </ImageInput>
            <i class="fa fa-at" />
          </div>
        </div>
        <div on:click|stopPropagation>
          {#each data.mentions as pubkey}
            <Chip class="mb-1 mr-1" theme="dark" onClick={() => removeMention(pubkey)}>
              {displayPubkey(pubkey)}
            </Chip>
          {:else}
            <div class="text-gray-2 inline-block py-2">No mentions</div>
          {/each}
          <div class="-mb-2" />
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 text-sm text-gray-5">
      <span>
        Posting as @{displayPubkey($session.pubkey)}
      </span>
    </div>
  </div>
{/if}
