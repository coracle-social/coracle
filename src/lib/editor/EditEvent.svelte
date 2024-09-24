<script lang="ts">
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {ellipsize} from "@welshman/lib"
  import {type TrustedEvent, fromNostrURI, Address} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import {deriveEvent, nostr} from "@app/state"

  export let node: NodeViewProps["node"]

  const displayEvent = (e: TrustedEvent) =>
    e?.content.length > 1
      ? ellipsize(e.content, 50)
      : fromNostrURI(nevent || naddr).slice(0, 16) + "..."

  $: ({identifier, pubkey, kind, id, relays = [], nevent, naddr} = node.attrs)
  $: event = deriveEvent(id || new Address(kind, pubkey, identifier).toString(), relays)
</script>

<NodeViewWrapper class="inline">
  <Link external href={nostr(node.attrs.nevent)} class="link-content">
    {displayEvent($event)}
  </Link>
</NodeViewWrapper>
