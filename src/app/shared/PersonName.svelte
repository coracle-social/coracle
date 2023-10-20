<script lang="ts">
  import cx from "classnames"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {
    deriveFollowing,
    derivePerson,
    displayPerson,
    session,
    follows,
    getWotScore,
    possibleImposters,
  } from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)

  const following = deriveFollowing(pubkey)

  const wotScore = follows.derived(pks => {
    if (!$session || $following || pubkey === $session.pubkey) {
      return null
    }

    return getWotScore($session.pubkey, pubkey)
  })

  const mayBeImposter = possibleImposters.derived(pubkeys => pubkeys.has(pubkey))
</script>

<div class={cx("flex items-center gap-1", $$props.class)}>
  <span class="cy-person-name">{displayPerson($person)}</span>
  <div class="flex items-center gap-1 font-normal">
    {#if $following}
      <span class="px-2 py-1 text-xs">
        <i class="fa fa-user-check pl-px text-accent" />
      </span>
    {:else if $mayBeImposter}
      <span class="px-2 py-1 text-xs">
        <i class="fa fa-warning text-warning" />
      </span>
    {:else if $wotScore !== null}
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="px-2 py-1 text-xs">
          <i class="fa fa-diagram-project text-accent" />
          {$wotScore}
        </span>
        <Anchor modal slot="tooltip" class="flex items-center gap-1" href="/help/web-of-trust">
          <i class="fa fa-info-circle" />
          WoT Score
        </Anchor>
      </Popover>
    {/if}
  </div>
</div>
