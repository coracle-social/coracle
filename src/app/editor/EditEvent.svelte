<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {ellipsize, nthEq} from "@welshman/lib"
  import {type TrustedEvent, fromNostrURI, Address} from "@welshman/util"
  import {router} from "../util"
  import {deriveEvent} from "src/engine"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  const displayEvent = (e: TrustedEvent) => {
    const content = e?.tags.find(nthEq(0, "alt"))?.[1] || e?.content

    return content?.length > 1
      ? ellipsize(content, 30)
      : fromNostrURI(nevent || naddr).slice(0, 16) + "..."
  }

  $: ({identifier, pubkey, kind, id, relays = [], nevent, naddr} = node.attrs)
  $: event = deriveEvent(id || new Address(kind, pubkey, identifier).toString(), relays)

  $: src = router
    .at("notes")
    .of(id || $event?.id, {relays})
    .toString()
</script>

<NodeViewWrapper class="inline">
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={src}
    class={cx("link-content", {"link-content-selected": selected})}>
    {displayEvent($event)}
  </a>
</NodeViewWrapper>
