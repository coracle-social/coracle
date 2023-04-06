<script lang="ts">
  import {find, propEq} from "ramda"
  import Anchor from 'src/partials/Anchor.svelte'
  import user from "src/agent/user"

  export let relay

  const {relays: userRelays} = user

  $: joined = find(propEq("url", relay.url), $userRelays)
</script>

<div class="flex flex-wrap items-center gap-3 whitespace-nowrap">
  {#if relay.contact}
    <Anchor type="button-circle" href={`mailto:${relay.contact}`}>
      <i class="fa fa-envelope" />
    </Anchor>
  {/if}
  {#if joined}
    {#if $userRelays.length > 1}
      <Anchor
        type="button"
        class="flex items-center gap-2 rounded-full"
        on:click={() => user.removeRelay(relay.url)}>
        <i class="fa fa-right-from-bracket" /> Leave
      </Anchor>
    {/if}
  {:else}
    <Anchor
      type="button"
      class="flex items-center gap-2 rounded-full"
      on:click={() => user.addRelay(relay.url)}>
      <i class="fa fa-right-to-bracket" /> Join
    </Anchor>
  {/if}
</div>
