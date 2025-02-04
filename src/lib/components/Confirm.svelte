<script lang="ts">
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"

  interface Props {
    title?: string
    subtitle?: string
    message: any
    confirm: any
  }

  const {subtitle = "", message, confirm, ...restProps}: Props = $props()

  let loading = $state(false)

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

<form class="column gap-4" onsubmit={preventDefault(tryConfirm)}>
  <ModalHeader>
    {#snippet title()}
      <div>{restProps.title || "Are you sure?"}</div>
    {/snippet}
    {#snippet info()}
      <div>{subtitle}</div>
    {/snippet}
  </ModalHeader>
  <p>{message}</p>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Confirm</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
