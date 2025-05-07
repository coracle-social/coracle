<script lang="ts">
  import {tryCatch} from "@welshman/lib"
  import {isRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {Pool, AuthStatus} from "@welshman/net"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoRelay from "@app/components/InfoRelay.svelte"
  import SpaceJoinConfirm, {confirmSpaceJoin} from "@app/components/SpaceJoinConfirm.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {attemptRelayAccess} from "@app/commands"

  const back = () => history.back()

  const joinRelay = async (invite: string) => {
    const [raw, claim] = invite.split("|")
    const url = normalizeRelayUrl(raw)
    const error = await attemptRelayAccess(url, claim)

    if (error) {
      return pushToast({theme: "error", message: error, timeout: 30_000})
    }

    const socket = Pool.get().get(url)

    if (socket.auth.status === AuthStatus.None) {
      pushModal(SpaceJoinConfirm, {url}, {replaceState: true})
    } else {
      await confirmSpaceJoin(url)
    }
  }

  const join = async () => {
    loading = true

    try {
      await joinRelay(url)
    } finally {
      loading = false
    }
  }

  let url = $state("")
  let loading = $state(false)

  const linkIsValid = $derived(
    Boolean(tryCatch(() => isRelayUrl(normalizeRelayUrl(url.split("|")[0])))),
  )
</script>

<form class="column gap-4" onsubmit={preventDefault(join)}>
  <ModalHeader>
    {#snippet title()}
      <div>Join a Space</div>
    {/snippet}
    {#snippet info()}
      <div>Enter an invite code below to join an existing space.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Invite code*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="link-round" />
        <input bind:value={url} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>
        You can also directly join any relay by entering its URL here.
        <Button class="link" onclick={() => pushModal(InfoRelay)}>What is a relay?</Button>
      </p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!linkIsValid || loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
