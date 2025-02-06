<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {displayProfileByPubkey} from "@welshman/app"
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Content from "@app/components/Content.svelte"

  const {
    verb,
    event,
    clear,
  }: {
    verb: string
    event: TrustedEvent
    clear: () => void
  } = $props()
</script>

<div
  class="relative border-l-2 border-solid border-primary bg-base-300 px-2 py-1 pr-8 text-xs"
  transition:slide>
  <p class="text-primary">{verb} @{displayProfileByPubkey(event.pubkey)}</p>
  {#key event.id}
    <Content {event} hideMedia minLength={100} maxLength={300} expandMode="disabled" />
  {/key}
  <Button class="absolute right-2 top-2 cursor-pointer" onclick={clear}>
    <Icon icon="close-circle" />
  </Button>
</div>
