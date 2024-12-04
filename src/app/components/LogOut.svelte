<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {logout} from "@app/commands"

  const back = () => history.back()

  const doLogout = async () => {
    loading = true

    try {
      await logout()
      window.location.href = "/"
    } catch (e) {
      loading = false
    }
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={doLogout}>
  <ModalHeader>
    <div slot="title">Are you sure you want<br />to log out?</div>
  </ModalHeader>
  <p class="text-center">Your local database will be cleared.</p>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Log Out</Spinner>
    </Button>
  </ModalFooter>
</form>
