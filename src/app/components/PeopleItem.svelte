<script lang="ts">
  import {onMount} from "svelte"
  import {ago, append, first, sortBy, WEEK, ctx} from "@welshman/lib"
  import {NOTE, getAncestorTags, getListTags, getPubkeyTagValues} from "@welshman/util"
  import type {Filter} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {
    repository,
    load,
    loadRelaySelections,
    userFollows,
    formatTimestamp,
    formatTimestampRelative,
  } from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushDrawer} from "@app/modal"

  export let pubkey

  const filters: Filter[] = [{kinds: [NOTE], authors: [pubkey], since: ago(WEEK)}]
  const events = deriveEvents(repository, {filters})

  const onClick = () => pushDrawer(ProfileDetail, {pubkey})

  $: roots = $events.filter(e => getAncestorTags(e.tags).replies.length === 0)

  onMount(async () => {
    // Make sure we have their relay selections before we load their posts
    await loadRelaySelections(pubkey)

    // Load at least one note, regardless of time frame
    load({
      filters: append({kinds: [NOTE], authors: [pubkey], limit: 1}, filters),
      relays: ctx.app.router.FromPubkeys([pubkey]).getUrls(),
    })
  })
</script>

<div class="card2 bg-alt shadow-xl">
  <Profile {pubkey} />
  <ProfileInfo {pubkey} />
  {#if roots.length > 0}
    {@const event = first(sortBy(e => -e.created_at, roots))}
    {@const following = getPubkeyTagValues(getListTags($userFollows)).includes(pubkey)}
    <div class="divider" />
    <Button class="chat chat-start" on:click={onClick}>
      <div class="chat-bubble">
        <Content hideMedia={!following} {event} />
        <p class="text-right text-xs">{formatTimestamp(event.created_at)}</p>
      </div>
    </Button>
    <div class="flex gap-2">
      <div class="badge badge-neutral">
        {roots.length} recent {roots.length === 1 ? "note" : "notes"}
      </div>
      <div class="badge badge-neutral">Last posted {formatTimestampRelative(event.created_at)}</div>
    </div>
  {/if}
</div>
