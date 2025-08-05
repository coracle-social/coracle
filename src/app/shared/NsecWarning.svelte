<script lang="ts">
  import Modal from "src/partials/Modal.svelte"
  import Button from "src/partials/Button.svelte"
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
      <Button class="btn" on:click={onAbort}>Abort</Button>
      <Button class="btn btn-danger" on:click={onBypass}>Proceed</Button>
    </div>
  </Content>
</Modal>
