<script lang="ts">
  import {clearStorage} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"

  const back = () => history.back()

  const logout = async () => {
    loading = true

    try {
      await clearStorage()
      localStorage.clear()
    } finally {
      loading = false
    }

    window.location.reload()
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={logout}>
  <ModalHeader>
    <div slot="title">Are you sure you want to log out?</div>
  </ModalHeader>
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
