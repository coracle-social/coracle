<script lang="ts">
  import cx from "classnames"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {deriveFollowing, derivePerson, displayPerson, session, getWotScore} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
  const following = deriveFollowing(pubkey)
  const wotScore = getWotScore($session?.pubkey, pubkey)
</script>

<div class={cx("flex gap-1", $$props.class)}>
  <span class="cy-person-name overflow-hidden text-ellipsis">
    {displayPerson($person)}
  </span>
  {#if $session}
    <div class="flex gap-1 font-normal">
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="whitespace-nowrap px-2 py-1 text-xs">
          {#if $following}
            <i class="fa fa-check-circle text-accent" />
          {:else}
            <i class="fa fa-diagram-project text-accent" />
          {/if}
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
