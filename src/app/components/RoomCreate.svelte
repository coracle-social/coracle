<script lang="ts">
  import {goto} from "$app/navigation"
  import {randomId} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {deriveRelay} from "@welshman/app"
  import {preventDefault} from "@lib/html"
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

  const {url} = $props()

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

  let name = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(create)}>
  <ModalHeader>
    {#snippet title()}
      <div>Create a Room</div>
    {/snippet}
    {#snippet info()}
      <div>
        On <span class="text-primary">{displayRelayUrl(url)}</span>
      </div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Room Name</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="hashtag" />
        <input bind:value={name} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!name || loading}>
      <Spinner {loading}>Create Room</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
