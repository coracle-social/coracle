<script lang="ts">
  import {onMount} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {ago, append, first, sortBy, max, WEEK, ctx} from '@welshman/lib'
  import {NOTE, getAncestorTags, getListValues} from '@welshman/util'
  import type {Filter} from '@welshman/util'
  import {deriveEvents} from '@welshman/store'
  import {repository, load, loadRelaySelections, userFollows, formatTimestamp, formatTimestampRelative} from '@welshman/app'
  import Link from '@lib/components/Link.svelte'
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import Content from "@app/components/Content.svelte"
  import {entityLink} from '@app/state'

  export let pubkey

  const filters: Filter[] = [{kinds: [NOTE], authors: [pubkey], since: ago(WEEK)}]
  const events = deriveEvents(repository, {filters})

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
    {@const relays = ctx.app.router.Event(event).getUrls()}
    {@const nevent = nip19.neventEncode({id: event.id, relays})}
    {@const following = getListValues("p", $userFollows).includes(pubkey)}
    <div class="divider" />
    <Link external class="chat chat-start" href={entityLink(nevent)}>
      <div class="chat-bubble">
        <Content hideMedia={!following} {event} />
        <p class="text-xs text-right">{formatTimestamp(event.created_at)}</p>
      </div>
    </Link>
    <div class="flex gap-2">
      <div class="badge badge-neutral">{roots.length} recent {roots.length === 1 ? 'note' : 'notes'}</div>
      <div class="badge badge-neutral">Last posted {formatTimestampRelative(event.created_at)}</div>
    </div>
  {/if}
</div>
