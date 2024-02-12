<script lang="ts">
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"

  export let onAbort
  export let onBypass
</script>

<Modal>
  <Content size="lg">
    <p class="flex items-center gap-4 text-xl">
      <i class="fa fa-triangle-exclamation" /> It looks like you might be sharing a private key.
    </p>
    <p>
      Private keys begin with "nsec" and are used to prove your identity by cryptographically
      signing messages - effectively equivalent to a password. Are you sure you want to continue?
    </p>
    <div class="flex gap-2">
      <Anchor button on:click={onAbort}>Abort</Anchor>
      <Anchor button danger on:click={onBypass}>Proceed</Anchor>
    </div>
  </Content>
</Modal>
