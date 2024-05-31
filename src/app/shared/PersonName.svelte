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
  import {themeColors} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {displayPubkey} from "src/domain"
  import {userFollows, deriveProfileDisplay, session, maxWot, getWotScore} from "src/engine"

  export let pubkey

  const following = derived(userFollows, $m => $m.has(pubkey))
  const wotScore = getWotScore($session?.pubkey, pubkey)
  const npubDisplay = displayPubkey(pubkey)
  const profileDisplay = deriveProfileDisplay(pubkey)

  $: superMaxWot = $maxWot * 1.5
  $: dashOffset = 100 - (Math.max(superMaxWot / 20, wotScore) / superMaxWot) * 100
  $: style = `transform: rotate(${dashOffset * 1.8 - 50}deg)`
  $: stroke = $themeColors[$following || pubkey === $session?.pubkey ? "accent" : "neutral-200"]
</script>

<div class={cx("flex gap-1", $$props.class)}>
  <div class="flex flex-col overflow-hidden text-ellipsis">
    <span class="cy-person-name">{$profileDisplay}</span>
    {#if $profileDisplay != npubDisplay}
      <small class="text-xs">{npubDisplay}</small>
    {/if}
  </div>
  {#if $session}
    <div class="flex gap-1 font-normal">
      <Popover triggerType="mouseenter">
        <span
          slot="trigger"
          class="relative flex h-10 w-10 items-center justify-center whitespace-nowrap px-4 text-xs">
          <svg height="32" width="32" class="absolute">
            <circle class="wot-background" cx="16" cy="16" r="15" />
            <circle
              cx="16"
              cy="16"
              r="15"
              class="wot-highlight"
              stroke-dashoffset={dashOffset}
              {style}
              {stroke} />
          </svg>
          {wotScore}
        </span>
        <Anchor modal slot="tooltip" class="flex items-center gap-1" href="/help/web-of-trust">
          <i class="fa fa-info-circle" />
          WoT Score
        </Anchor>
      </Popover>
    </div>
  {/if}
</div>
