<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import Profile from "@app/components/Profile.svelte"

  export let title
  export let subtitle = ""
  export let pubkeys
</script>

<div class="column gap-4">
  <ModalHeader>
    <div slot="title">{title}</div>
    <div slot="info">{subtitle}</div>
  </ModalHeader>
  {#each pubkeys as pubkey (pubkey)}
    <div class="card2 bg-alt">
      <Profile {pubkey} />
    </div>
  {/each}
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
