<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"

  export let event
</script>

<div class="column gap-4">
  <ModalHeader>
    <div slot="title">Event Details</div>
    <div slot="info">The full details of this event are shown below.</div>
  </ModalHeader>
  <pre class="overflow-auto"><code>{JSON.stringify(event, null, 2)}</code></pre>
  <Button class="btn btn-primary" on:click={() => history.back()}>Got it</Button>
</div>
