<script lang="ts">
  import {goto} from "$app/navigation"
  import {displayRelayUrl} from "@welshman/util"
  import Field from "@lib/components/Field.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {addRoomMembership} from "@app/commands"
  import {makeSpacePath} from "@app/routes"

  export let url

  const back = () => history.back()

  const tryCreate = async () => {
    addRoomMembership(url, room)
    goto(makeSpacePath(url, room))
  }

  const create = async () => {
    loading = true

    try {
      await tryCreate()
    } finally {
      loading = false
    }
  }

  let room = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={create}>
  <ModalHeader>
    <div slot="title">Create a Room</div>
    <div slot="info">
      On <span class="text-primary">{displayRelayUrl(url)}</span>
    </div>
  </ModalHeader>
  <Field>
    <p slot="label">Room Name</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="hashtag" />
      <input bind:value={room} class="grow" type="text" />
    </label>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!room || loading}>
      <Spinner {loading}>Create Room</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
