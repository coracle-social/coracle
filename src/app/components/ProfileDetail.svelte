<script lang="ts">
  import {onMount} from 'svelte'
  import {sleep} from '@welshman/lib'
  import {feedFromFilter} from '@welshman/feeds'
  import {NOTE, displayProfile, displayPubkey} from '@welshman/util'
  import type {TrustedEvent} from '@welshman/util'
  import {deriveProfile, displayNip05, feedLoader} from '@welshman/app'
  import {createScroller} from "@lib/html"
  import Avatar from "@lib/components/Avatar.svelte"
  import Spinner from '@lib/components/Spinner.svelte'
  import Content from "@app/components/Content.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const pubkeyDisplay = displayPubkey(pubkey)

  const feed = feedFromFilter({kinds: [NOTE], authors: [pubkey]})

  const loader = feedLoader.getLoader(feed, {
    onEvent: (event: TrustedEvent) => {
      events = events.concat(event)
    },
  })

  let element: Element
  let events: TrustedEvent[] = []

  onMount(() => {
    const scroller = createScroller({
      element: element,
      onScroll: async () => {
        const $loader = await loader

        $loader(10)
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="flex flex-col gap-4 p-4 max-w-full" bind:this={element}>
  {#if $profile}
    <div class="flex max-w-full gap-3">
      <div class="py-1">
        <Avatar src={$profile?.picture} size={10} />
      </div>
      <div class="flex min-w-0 flex-col">
        <div class="flex items-center gap-2">
          <div class="text-bold overflow-hidden text-ellipsis">
            {displayProfile($profile, pubkeyDisplay)}
          </div>
        </div>
        <div class="overflow-hidden text-ellipsis text-sm opacity-75">
          {$profile?.nip05 ? displayNip05($profile.nip05) : pubkeyDisplay}
        </div>
      </div>
    </div>
    <Content event={{content: $profile.about, tags: []}} hideMedia />
    <p class="text-xl">Recent notes</p>
    <div class="flex flex-col gap-2">
      {#each events as event (event.id)}
        <div class="card2 bg-alt">
          <Content {event} />
        </div>
      {/each}
    </div>
  {:else}
    <p class="flex center my-12">
      {#await sleep(3000)}
        <Spinner loading />
      {:then}
        Unable to find this profile.
      {/await}
    </p>
  {/if}
</div>
