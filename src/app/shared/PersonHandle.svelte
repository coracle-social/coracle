<script lang="ts">
  import {Nip05} from 'src/app/engine'

  export let pubkey

  const handle = Nip05.handles.key(pubkey)
</script>

{#if $handle}
  <span class="opacity-75">{Nip05.displayHandle($handle)}</span>
{/if}
