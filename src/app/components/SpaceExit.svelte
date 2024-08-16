<script lang="ts">
  import {goto} from "$app/navigation"
  import {append, uniqBy} from "@welshman/lib"
  import {GROUPS} from "@welshman/util"
  import CardButton from "@lib/components/CardButton.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import SpaceCreateFinish from "@app/components/SpaceCreateFinish.svelte"
  import {pushModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {GROUP_DELIMITER, splitGroupId, loadRelay, loadGroup, deriveGroup} from "@app/state"
  import {removeGroupMemberships} from "@app/commands"

  export let nom

  const group = deriveGroup(nom)

  const back = () => history.back()

  const exit = async () => {
    loading = true

    try {
      await removeGroupMemberships([nom])
    } finally {
      loading = false
    }

    goto("/home")
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={exit}>
  <h1 class="heading">
    You are leaving <span class="text-primary">{$group?.name || "[no name]"}</span>
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
