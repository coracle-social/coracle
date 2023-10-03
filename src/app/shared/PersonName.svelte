<script lang="ts">
  import cx from "classnames"
  import {
    deriveFollowing,
    derivePerson,
    displayPerson,
    session,
    follows,
    getFollowsWhoFollow,
  } from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
  const following = deriveFollowing(pubkey)
  const followCount = follows.derived(pks => {
    if ($following || pubkey === $session.pubkey) {
      return null
    }

    return getFollowsWhoFollow($session.pubkey, pubkey).length
  })
</script>

<div class={cx("flex items-center gap-1", $$props.class)}>
  <span>{displayPerson($person)}</span>
  <div class="flex items-center gap-1 font-normal">
    {#if $following}
      <span class="px-2 py-1 text-xs">
        <i class="fa fa-user-check pl-px text-accent" />
      </span>
    {:else if $followCount}
      <span class="px-2 py-1 text-xs">
        <i class="fa fa-diagram-project text-accent" />
        {$followCount}
      </span>
    {/if}
  </div>
</div>
