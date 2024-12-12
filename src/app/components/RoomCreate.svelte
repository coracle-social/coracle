<script lang="ts">
  import {goto} from "$app/navigation"
  import {randomId} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import Field from "@lib/components/Field.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {hasNip29} from "@app/state"
  import {addRoomMembership, nip29, getThunkError} from "@app/commands"
  import {makeSpacePath} from "@app/routes"
  import {pushToast} from "@app/toast"

  export let url

  const room = randomId()
  const relay = deriveRelay(url)

  const back = () => history.back()

  const tryCreate = async () => {
    if (hasNip29($relay)) {
      const createMessage = await getThunkError(nip29.createRoom(url, room))

      if (createMessage && !createMessage.match(/^duplicate:|already a member/)) {
        return pushToast({theme: "error", message: createMessage})
      }

      const editMessage = await getThunkError(nip29.editMeta(url, room, {name}))

      if (editMessage) {
        return pushToast({theme: "error", message: editMessage})
      }

      const joinMessage = await getThunkError(nip29.joinRoom(url, room))

      if (joinMessage && !joinMessage.includes("already")) {
        return pushToast({theme: "error", message: joinMessage})
      }
    }

    addRoomMembership(url, room, name)
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

  let name = ""
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
      <input bind:value={name} class="grow" type="text" />
    </label>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!name || loading}>
      <Spinner {loading}>Create Room</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
