<script lang="ts">
  import {nip19} from "nostr-tools"
  import {nthEq} from "@welshman/lib"
  import {Address} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {deriveEvent, entityLink, MESSAGE, THREAD} from "@app/state"
  import {makeThreadPath} from "@app/routes"

  export let value
  export let depth = 0

  const {id, identifier, kind, pubkey, relays} = value
  const addr = new Address(kind, pubkey, identifier)
  const idOrAddress = id || addr.toString()
  const event = deriveEvent(idOrAddress, relays)
  const entity = id ? nip19.neventEncode({id, relays}) : addr.toNaddr()

  const getLocalHref = (e: TrustedEvent) => {
    const url = e.tags.find(nthEq(0, "~"))?.[2]

    if (!url) return
    if ([MESSAGE, THREAD].includes(e.kind)) return makeThreadPath(url, e.id)

    const kind = e.tags.find(nthEq(0, "K"))?.[1]
    const id = e.tags.find(nthEq(0, "E"))?.[1]

    if (!id || !kind) return
    if ([MESSAGE, THREAD].includes(parseInt(kind))) return makeThreadPath(url, id)
  }

  // If we found this event on a relay that the user is a member of, redirect internally
  $: localHref = $event ? getLocalHref($event) : null
  $: href = localHref || entityLink(entity)
</script>

<Link external={!localHref} {href} class="my-2 block max-w-full text-left">
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
