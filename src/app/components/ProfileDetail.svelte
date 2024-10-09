<script lang="ts">
  import {onMount} from "svelte"
  import {sleep, sortBy, flatten} from "@welshman/lib"
  import {feedFromFilter} from "@welshman/feeds"
  import {NOTE, displayProfile, displayPubkey, getAncestorTags} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {repository, deriveProfile, displayNip05, feedLoader} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import {fly} from "@lib/transition"
  import Avatar from "@lib/components/Avatar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const pubkeyDisplay = displayPubkey(pubkey)
  const filter = {kinds: [NOTE], authors: [pubkey]}
  const events = deriveEvents(repository, {filters: [filter]})
  const loader = feedLoader.getLoader(feedFromFilter(filter))

  let element: Element

  onMount(() => {
    const scroller = createScroller({
      element: element.closest(".menu")!,
      onScroll: async () => {
        const $loader = await loader

        $loader(5)
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="flex max-w-full flex-col gap-4 p-4" bind:this={element}>
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
    <div class="flex flex-col gap-2">
      {#each sortBy(e => -e.created_at, $events) as event (event.id)}
        {#if flatten(Object.values(getAncestorTags(event.tags))).length === 0}
          <div class="card2 bg-alt" in:fly>
            <NoteCard hideProfile {event}>
              <Content {event} />
            </NoteCard>
          </div>
        {/if}
      {:else}
        <p class="flex center my-12">
          <Spinner loading />
        </p>
      {/each}
    </div>
  {:else}
    <p class="center my-12 flex">
      {#await sleep(3000)}
        <Spinner loading />
      {:then}
        Unable to find this profile.
      {/await}
    </p>
  {/if}
</div>
