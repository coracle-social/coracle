<style>
  .wot-background {
    fill: transparent;
    stroke: var(--neutral-600);
  }

  .wot-highlight {
    fill: transparent;
    stroke-width: 1.5;
    stroke-dasharray: 100 100;
    transform-origin: center;
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import * as nip19 from "nostr-tools/nip19"
  import {displayPubkey} from "@welshman/util"
  import {session, deriveProfileDisplay} from "@welshman/app"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import WotPopover from "./WotPopover.svelte"

  export let pubkey
  export let displayNpubCopyButton = false

  const npub = nip19.npubEncode(pubkey)
  const npubDisplay = displayPubkey(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
</script>

<div class={cx("flex gap-1", $$props.class)}>
  <div class="flex items-center gap-2 overflow-hidden">
    <div class="w-full gap-2">
      <div
        class="cy-person-name flex max-w-[100%] items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        {$profileDisplay}
        {#if $session}
          <WotPopover {pubkey} />
        {/if}
      </div>
      <div class="flex flex-row items-center gap-1 text-xs">
        <PersonHandle class="hidden whitespace-nowrap text-accent xs:block" {pubkey}>
          <span class="hidden opacity-50 xs:block">-</span>
        </PersonHandle>
        <p class="whitespace-nowrap opacity-50">{npubDisplay}</p>
        {#if displayNpubCopyButton}
          <CopyValueSimple class="pl-1" value={npub} label="Npub" />
        {/if}
      </div>
    </div>
  </div>
</div>
