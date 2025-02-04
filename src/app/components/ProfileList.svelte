<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import Profile from "@app/components/Profile.svelte"

  interface Props {
    title: any
    subtitle?: string
    pubkeys: any
  }

  const {subtitle = "", pubkeys, ...restProps}: Props = $props()
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>{restProps.title}</div>
    {/snippet}
    {#snippet info()}
      <div>{subtitle}</div>
    {/snippet}
  </ModalHeader>
  {#each pubkeys as pubkey (pubkey)}
    <div class="card2 bg-alt">
      <Profile {pubkey} />
    </div>
  {/each}
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
