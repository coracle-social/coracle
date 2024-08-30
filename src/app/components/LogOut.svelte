<script lang="ts">
  import {clearStorage} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"

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
  <h1 class="heading">Are you sure you want to log out?</h1>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Log Out</Spinner>
    </Button>
  </div>
</form>
