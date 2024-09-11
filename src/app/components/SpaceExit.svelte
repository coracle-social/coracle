<script lang="ts">
  import {goto} from "$app/navigation"
  import {displayRelayUrl} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {removeSpaceMembership} from "@app/commands"

  export let url

  const back = () => history.back()

  const exit = async () => {
    loading = true

    try {
      await removeSpaceMembership(url)
    } finally {
      loading = false
    }

    goto("/home")
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={exit}>
  <h1 class="heading">
    You are leaving <span class="text-primary">{displayRelayUrl(url)}</span>
  </h1>
  <p class="text-center">Are you sure you want to leave?</p>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Confirm</Spinner>
    </Button>
  </div>
</form>
