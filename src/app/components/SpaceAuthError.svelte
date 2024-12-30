<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {clearModals} from "@app/modal"
  import {attemptRelayAccess} from "@app/commands"

  export let url
  export let error

  const back = () => history.back()

  const joinRelay = async (claim: string) => {
    const error = await attemptRelayAccess(url, claim)

    if (error) {
      return pushToast({theme: "error", message: error})
    }

    pushToast({
      message: "You have successfully joined the space!",
    })

    clearModals()
  }

  const join = async () => {
    loading = true

    try {
      await joinRelay(claim)
    } finally {
      loading = false
    }
  }

  let claim = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <ModalHeader>
    <div slot="title">Access Error</div>
    <div slot="info">We couldn't connect you to this space.</div>
  </ModalHeader>
  <p>
    We received an error from the relay indicating you don't have access to {displayRelayUrl(url)}.
  </p>
  <p class="border-l border-solid border-error pl-4 text-error">
    {error}
  </p>
  <p>If you have one, you can try entering an invite code below to request access.</p>
  <Field>
    <p slot="label">Invite code</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="link-round" />
      <input bind:value={claim} class="grow" type="text" />
    </label>
    <p slot="info">Enter an invite code provided to you by the admin of the relay.</p>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!claim || loading}>
      <Spinner {loading}>Request Access</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
