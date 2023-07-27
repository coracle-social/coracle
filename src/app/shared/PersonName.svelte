<script lang="ts">
  import cx from "classnames"
  import {defaultTo} from "ramda"
  import {Directory, user} from "src/app/engine"

  export let pubkey
  export let inert = false

  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const following = user.followsSet.derived(s => s.has(pubkey))
</script>

<div
  class={cx("flex items-center gap-2 group/PersonName", $$props.class)}>
  <span class={cx({
    "duration-600 transition-all border-b border-solid border-transparent group-hover/PersonName:border-gray-3": !inert,
  })}>
    {Directory.displayProfile($profile)}
  </span>
  {#if $following}
    <i class="fa fa-user-check text-xs text-accent" />
  {/if}
</div>
