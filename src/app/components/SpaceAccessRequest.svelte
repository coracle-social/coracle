<script lang="ts">
  import {displayUrl} from "@welshman/lib"
  import {Pool, AuthStatus} from "@welshman/net"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import SpaceJoinConfirm, {confirmSpaceJoin} from "@app/components/SpaceJoinConfirm.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {attemptRelayAccess} from "@app/commands"

  type Props = {
    url: string
  }

  const {url}: Props = $props()

  const back = () => history.back()

  const joinRelay = async () => {
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
      await joinRelay()
    } finally {
      loading = false
    }
  }

  let claim = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(join)}>
  <ModalHeader>
    {#snippet title()}
      <div>Request Access</div>
    {/snippet}
    {#snippet info()}
      <div>Enter an invite code below to request access to {displayUrl(url)}.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Invite code*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="link-round" />
        <input bind:value={claim} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
