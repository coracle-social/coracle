<script lang="ts">
  import {tryCatch, first, removeNil} from "@welshman/lib"
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

  const joinRelay = async () => {
    const promises: Promise<string | undefined>[] = []

    const [rawUrl, rawClaim] = url.split("|")
    const normalizedUrl = normalizeRelayUrl(rawUrl)

    if (claim) {
      promises.push(attemptRelayAccess(normalizedUrl, claim))
    }

    if (rawClaim) {
      promises.push(attemptRelayAccess(normalizedUrl, rawClaim))
    }

    if (promises.length === 0) {
      promises.push(attemptRelayAccess(normalizedUrl, ""))
    }

    const error = first(removeNil(await Promise.all(promises)))

    if (error) {
      return pushToast({theme: "error", message: error, timeout: 30_000})
    }

    const socket = Pool.get().get(normalizedUrl)

    if (socket.auth.status === AuthStatus.None) {
      pushModal(SpaceJoinConfirm, {url: normalizedUrl}, {replaceState: true})
    } else {
      await confirmSpaceJoin(normalizedUrl)
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

  let url = $state("")
  let claim = $state("")
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
      <div>Enter a relay URL below to join an existing space.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Relay URL*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="link-round" />
        <input bind:value={url} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>
        Enter the URL of the relay that hosts the space you'd like to join.
        <Button class="link" onclick={() => pushModal(InfoRelay)}>What is a relay?</Button>
      </p>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Invite Code (optional)</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="ticket" />
        <input bind:value={claim} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>If you have an invite code, enter it here to get access.</p>
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
