<script lang="ts">
  import {nip19} from "nostr-tools"
  import {nthEq} from "@welshman/lib"
  import {Address} from "@welshman/util"
  import {trackerStore} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {deriveEvent, entityLink, userMembership, getMembershipUrls, REPLY} from "@app/state"
  import {makeThreadPath} from "@app/routes"

  export let value
  export let depth = 0

  const {id, identifier, kind, pubkey, relays} = value
  const addr = new Address(kind, pubkey, identifier)
  const idOrAddress = id || addr.toString()
  const event = deriveEvent(idOrAddress, relays)
  const entity = id ? nip19.neventEncode({id, relays}) : addr.toNaddr()

  // If we found this event on a relay that the user is a member of, redirect internally
  $: url = getMembershipUrls($userMembership).find(url => $trackerStore.hasRelay($event.id, url))
  $: root = $event?.kind === REPLY ? $event.tags.find(nthEq(0, 'E'))?.[1] : $event?.id
  $: href = url && root ? makeThreadPath(url, root) : entityLink(entity)
</script>

<Link external={!url} {href} class="my-2 block max-w-full text-left">
  {#if $event}
    <NoteCard event={$event} class="bg-alt rounded-box p-4">
      <slot name="note-content" event={$event} {depth} />
    </NoteCard>
  {:else}
    <div class="rounded-box p-4">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</Link>
