<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import InfoKeys from "@app/components/InfoKeys.svelte"
  import {pushModal} from "@app/modal"
</script>

<p class="text-sm card2 bg-alt transition-all">
  A remote signer is a simple way to protect your private key.
  <Button class="link" on:click={() => pushModal(InfoKeys)}>What is a private key?</Button>
</p>
