<script lang="ts">
  import cx from 'classnames'
  import {defaultTo} from 'ramda'
  import {Directory, User} from 'src/app/engine'

  export let pubkey

  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const following = User.followsSet.derived(s => s.has(pubkey))
</script>

<div class={cx("flex gap-2 items-center", $$props.class)}>
  <span>{Directory.displayProfile($profile)}</span>
  {#if $following}
    <i class="fa fa-user-check text-accent text-sm" />
  {/if}
</div>
