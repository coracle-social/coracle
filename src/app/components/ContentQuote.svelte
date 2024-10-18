<script lang="ts">
  import {nip19} from "nostr-tools"
  import {Address} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {deriveEvent, entityLink} from "@app/state"

  export let value
  export let depth = 0

  const {id, identifier, kind, pubkey, relays} = value
  const addr = new Address(kind, pubkey, identifier)
  const idOrAddress = id || addr.toString()
  const event = deriveEvent(idOrAddress, relays)
  const entity = id ? nip19.neventEncode({id, relays}) : addr.toNaddr()
</script>

<Link external href={entityLink(entity)} class="my-2 block max-w-full text-left">
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
