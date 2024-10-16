<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"

  export let title = "Are you sure?"
  export let subtitle = ""
  export let message
  export let confirm

  let loading = false

  const tryConfirm = async () => {
    loading = true

    try {
      await confirm()
    } finally {
      loading = false
    }
  }

  const back = () => history.back()
</script>

<form class="column gap-4" on:submit|preventDefault={tryConfirm}>
  <ModalHeader>
    <div slot="title">{title}</div>
    <div slot="info">{subtitle}</div>
  </ModalHeader>
  <p>{message}</p>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Confirm</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
