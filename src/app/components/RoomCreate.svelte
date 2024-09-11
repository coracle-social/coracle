<script lang="ts">
  import {goto} from "$app/navigation"
  import {displayRelayUrl} from "@welshman/util"
  import Field from "@lib/components/Field.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {addRoomMembership} from "@app/commands"
  import {makeSpacePath} from "@app/routes"

  export let url

  const back = () => history.back()

  const tryCreate = async () => {
    await addRoomMembership(url, topic)

    goto(makeSpacePath(url, topic))
  }

  const create = async () => {
    loading = true

    try {
      await tryCreate()
    } finally {
      loading = false
    }
  }

  let topic = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={create}>
  <h1 class="heading">Create a Room</h1>
  <p class="text-center">
    On <span class="text-primary">{displayRelayUrl(url)}</span>
  </p>
  <Field>
    <p slot="label">Room Name</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="hashtag" />
      <input bind:value={topic} class="grow" type="text" />
    </label>
  </Field>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!topic || loading}>
      <Spinner {loading}>Create Room</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
