<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Chat from "@app/components/Chat.svelte"

  $: id = $pubkey!
</script>

<Chat {id} />
