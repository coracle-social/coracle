<script lang="ts">
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {ctx, sleep, sortBy, flatten} from "@welshman/lib"
  import {feedFromFilter} from "@welshman/feeds"
  import {
    NOTE,
    displayProfile,
    getListTags,
    getPubkeyTagValues,
    displayPubkey,
    getAncestorTags,
  } from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {
    repository,
    userFollows,
    tagPubkey,
    follow,
    unfollow,
    deriveProfile,
    displayNip05,
    feedLoader,
  } from "@welshman/app"
  import {createScroller} from "@lib/html"
  import {fly} from "@lib/transition"
  import Link from "@lib/components/Link.svelte"
  import Avatar from "@lib/components/Avatar.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {entityLink} from "@app/state"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const pubkeyDisplay = displayPubkey(pubkey)
  const filter = {kinds: [NOTE], authors: [pubkey]}
  const events = deriveEvents(repository, {filters: [filter]})
  const loader = feedLoader.getLoader(feedFromFilter(filter), {})
  const relays = ctx.app.router.FromPubkeys([pubkey]).getUrls()
  const nprofile = nip19.nprofileEncode({pubkey, relays})

  let element: Element

  onMount(() => {
    const scroller = createScroller({
      element,
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
    <Link external href={entityLink(nprofile)} class="row-3 max-w-full justify-between">
      <div class="row-3 min-w-0">
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
      {#if getPubkeyTagValues(getListTags($userFollows)).includes(pubkey)}
        <button
          type="button"
          class="btn btn-neutral"
          on:click|preventDefault={() => unfollow(pubkey)}>
          Unfollow
        </button>
      {:else}
        <button
          type="button"
          class="btn btn-primary"
          on:click|preventDefault={() => follow(tagPubkey(pubkey))}>
          Follow
        </button>
      {/if}
    </Link>
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
