<script lang="ts">
  import cx from "classnames"
  import {deriveFollowing, derivePerson, displayPerson} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
  const following = deriveFollowing(pubkey)
</script>

<div class={cx("flex items-center gap-2", $$props.class)}>
  <span>{displayPerson($person)}</span>
  {#if $following}
    <i class="fa fa-user-check ml-2 text-xs text-accent" />
  {/if}
</div>
