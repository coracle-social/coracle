<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Page from "@lib/components/Page.svelte"
  import Chat from "@app/components/Chat.svelte"

  $: id = $pubkey!
</script>

<Page>
  <Chat {id}>
    <p slot="info">
      This is a place for your notes. Everything you write here is encrypted and stored on the nostr
      network.
    </p>
  </Chat>
</Page>
