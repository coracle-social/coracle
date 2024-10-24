<script lang="ts">
  import {onMount} from "svelte"
  import {first, sortBy, ctx} from "@welshman/lib"
  import {getAncestorTags} from "@welshman/util"
  import type {Filter} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {repository, load, loadRelaySelections, formatTimestampRelative} from "@welshman/app"
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"

  export let pubkey

  const filters: Filter[] = [{authors: [pubkey]}]
  const events = deriveEvents(repository, {filters})

  $: roots = $events.filter(e => getAncestorTags(e.tags).replies.length === 0)

  onMount(async () => {
    // Make sure we have their relay selections before we load their posts
    await loadRelaySelections(pubkey)

    // Load at least one note, regardless of time frame
    load({
      filters: [{authors: [pubkey], limit: 1}],
      relays: ctx.app.router.FromPubkeys([pubkey]).getUrls(),
    })
  })
</script>

<div class="card2 bg-alt col-2 shadow-xl">
  <Profile {pubkey} />
  <ProfileInfo {pubkey} />
  {#if roots.length > 0}
    {@const event = first(sortBy(e => -e.created_at, roots))}
    <div class="bg-alt badge badge-neutral border-none">
      Last active {formatTimestampRelative(event.created_at)}
    </div>
  {/if}
</div>
