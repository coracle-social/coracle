<script lang="ts">
  import cx from "classnames"
  import {defaultTo} from "ramda"
  import {Directory, user} from "src/app/engine"

  export let pubkey

  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const following = user.followsSet.derived(s => s.has(pubkey))
</script>

<div class={cx("flex items-center gap-2", $$props.class)}>
  <span>{Directory.displayProfile($profile)}</span>
  {#if $following}
    <i class="fa fa-user-check ml-2 text-xs text-accent" />
  {/if}
</div>
