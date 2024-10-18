<script lang="ts">
  import {nip19} from "nostr-tools"
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
  import Link from "@lib/components/Link.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushDrawer} from "@app/modal"
  import {entityLink} from "@app/state"

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

<Button class="card2 bg-alt shadow-xl flex flex-col" on:click={onClick}>
  <Profile {pubkey} />
  <ProfileInfo {pubkey} />
  {#if roots.length > 0}
    {@const event = first(sortBy(e => -e.created_at, roots))}
    {@const relays = ctx.app.router.Event(event).getUrls()}
    {@const nevent = nip19.neventEncode({id: event.id, relays})}
    {@const following = getPubkeyTagValues(getListTags($userFollows)).includes(pubkey)}
    <div class="divider" />
    <button type="button" class="chat chat-start cursor-default flex" on:click|stopPropagation>
      <div class="bg-alt col-4 chat-bubble text-left">
        <Content showEntire hideMedia={!following} {event} />
        <Link external href={entityLink(nevent)} class="row-2 group justify-end whitespace-nowrap">
          <Icon icon="link-round" size={3} />
          <p class="text-xs">{formatTimestamp(event.created_at)}</p>
        </Link>
      </div>
    </button>
    <div class="flex gap-2">
      <div class="bg-alt badge badge-neutral border-none">
        {roots.length} recent {roots.length === 1 ? "note" : "notes"}
      </div>
      <div class="bg-alt badge badge-neutral border-none">
        Last posted {formatTimestampRelative(event.created_at)}
      </div>
    </div>
  {/if}
</Button>
