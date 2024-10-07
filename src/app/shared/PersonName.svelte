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
  import {nip19} from "nostr-tools"
  import {derived} from "svelte/store"
  import {displayPubkey} from "@welshman/util"
  import {session, deriveProfileDisplay, getUserWotScore} from "@welshman/app"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import WotScore from "src/partials/WotScore.svelte"
  import {userFollows, maxWot} from "src/engine"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"

  export let pubkey
  export let displayNpubCopyButton = false

  const following = derived(userFollows, $m => $m.has(pubkey))
  const wotScore = getUserWotScore(pubkey)
  const npub = nip19.npubEncode(pubkey)
  const npubDisplay = displayPubkey(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const accent = $following || pubkey === $session?.pubkey
</script>

<div class={cx("flex gap-1", $$props.class)}>
  <div class="flex w-full flex-col">
    <div class="flex w-full items-center gap-2">
      <span class="cy-person-name max-w-[80%] overflow-hidden text-ellipsis"
        >{$profileDisplay}</span>
      {#if $session}
        <div on:click|stopPropagation>
          <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
            <div slot="trigger">
              <WotScore score={wotScore} max={$maxWot} {accent} />
            </div>
            <Anchor modal slot="tooltip" class="flex items-center gap-1" href="/help/web-of-trust">
              <i class="fa fa-info-circle" />
              WoT Score: {wotScore}
            </Anchor>
          </Popover>
        </div>
      {/if}
    </div>
    <div class="flex flex-row items-center text-sm">
      <small>{npubDisplay}</small>
      {#if displayNpubCopyButton}
        <CopyValueSimple class="pl-1" value={npub} label="Npub" />
      {/if}
    </div>
  </div>
</div>
