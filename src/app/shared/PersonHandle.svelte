<script lang="ts">
  import {nip19} from "nostr-tools"
  import {Nip05} from "src/app/engine"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const handle = Nip05.handles.key(pubkey)
</script>

{#if $handle}
  <div class="opacity-75">{Nip05.displayHandle($handle)}</div>
{:else}
  <div class="overflow-hidden overflow-ellipsis opacity-75">{npub}</div>
{/if}
