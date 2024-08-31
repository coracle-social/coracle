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
  import {derived} from "svelte/store"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import WotScore from "src/partials/WotScore.svelte"
  import {displayPubkey} from "src/domain"
  import {userFollows, deriveProfileDisplay, session, maxWot, getWotScore} from "src/engine"
  import {isMobile} from "src/util/html"

  export let pubkey

  const following = derived(userFollows, $m => $m.has(pubkey))
  const wotScore = getWotScore($session?.pubkey, pubkey)
  const npubDisplay = displayPubkey(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)
  const accent = $following || pubkey === $session?.pubkey

  function handleClick(event: MouseEvent) {
    if (isMobile) {
      const target = event.target as HTMLElement
      const popoverBlock = (event.currentTarget as HTMLElement).querySelector(".popover-block")

      if (popoverBlock && popoverBlock.contains(target)) {
        event.stopPropagation()
      }
    }
  }
</script>

<button type="button" class={cx("flex gap-1", $$props.class)} on:click={handleClick}>
  <div class="flex flex-col overflow-hidden text-ellipsis">
    <span class="cy-person-name">{$profileDisplay}</span>
    {#if $profileDisplay != npubDisplay}
      <small class="text-xs">{npubDisplay}</small>
    {/if}
  </div>
  {#if $session}
    <div class="popover-block flex gap-1 font-normal">
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <WotScore score={wotScore} max={$maxWot} {accent} />
        </div>
        <Anchor modal slot="tooltip" class="flex items-center gap-1" href="/help/web-of-trust">
          <i class="fa fa-info-circle" />
          WoT Score
        </Anchor>
      </Popover>
    </div>
  {/if}
</button>
