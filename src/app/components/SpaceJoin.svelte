<script lang="ts">
  import {append, remove} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {addSpaceMembership} from "@app/commands"

  export let url

  const relay = deriveRelay(url)

  const back = () => history.back()

  const tryJoin = async () => {
    await addSpaceMembership(url)

    clearModal()
  }

  const join = async () => {
    loading = true

    try {
      await tryJoin()
    } finally {
      loading = false
    }
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <h1 class="heading">
    Joining <span class="text-primary">{displayRelayUrl(url)}</span>
  </h1>
  <p class="text-center">Are you sure you'd like to join this space?</p>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
