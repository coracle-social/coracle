<script lang="ts">
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>What is nostr?</div>
    {/snippet}
  </ModalHeader>
  <p>
    <Link external href="https://nostr.com/" class="link">Nostr</Link> is way to build social apps that
    talk to each other. Users own their social identity instead of renting it from a tech company, and
    can take it with them.
  </p>
  <p>
    If you'd like to learn more about what other apps exist in the nostr ecosystem, please visit <Link
      external
      class="link"
      href="https://nostrapps.com/">nostrapps.com</Link
    >.
  </p>
  <p>
    To learn more about how to manage your keys, or to set up an account, try
    <Link external class="link" href="https://nosta.me/">nosta.me</Link>.
  </p>
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
