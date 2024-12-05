<script lang="ts">
  import cx from "classnames"
  import type {NodeViewProps} from "@tiptap/core"
  import {NodeViewWrapper} from "svelte-tiptap"
  import {always, nthEq} from "@welshman/lib"
  import {parse, renderAsText, ParsedType} from "@welshman/content"
  import {type TrustedEvent, fromNostrURI, Address} from "@welshman/util"
  import Link from "@lib/components/Link.svelte"
  import {deriveEvent, entityLink} from "@app/state"

  export let node: NodeViewProps["node"]
  export let selected: NodeViewProps["selected"]

  const renderLink = (href: string, display: string) => display

  const displayEvent = (e: TrustedEvent) => {
    const content = e?.tags.find(nthEq(0, "alt"))?.[1] || e?.content || ""

    if (content.length < 1) {
      return fromNostrURI(nevent || naddr).slice(0, 16) + "..."
    }

    const parsed = parse({...e, content})

    // Try stripping entities, but if we get nothing back go ahead and show them
    const renderEntity = always(parsed.find(p => p.type === ParsedType.Text) ? "" : "[quote]")

    return renderAsText(parsed, {renderLink, renderEntity})
  }

  $: ({identifier, pubkey, kind, id, relays = [], nevent, naddr} = node.attrs)
  $: event = deriveEvent(id || new Address(kind, pubkey, identifier).toString(), relays)
</script>

<NodeViewWrapper class="inline">
  <Link
    external
    href={entityLink(node.attrs.nevent)}
    class={cx("link-content", {"link-content-selected": selected})}>
    {displayEvent($event)}
  </Link>
</NodeViewWrapper>
