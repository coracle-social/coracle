<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {preventDefault} from "@lib/html"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {clearModals} from "@app/modal"
  import {attemptRelayAccess} from "@app/commands"

  const {url, error} = $props()

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

  let claim = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(join)}>
  <ModalHeader>
    {#snippet title()}
      <div>Access Error</div>
    {/snippet}
    {#snippet info()}
      <div>We couldn't connect you to this space.</div>
    {/snippet}
  </ModalHeader>
  <p>
    We received an error from the relay indicating you don't have access to {displayRelayUrl(url)}.
  </p>
  <p class="border-l border-solid border-error pl-4 text-error">
    {error}
  </p>
  <p>If you have one, you can try entering an invite code below to request access.</p>
  <Field>
    {#snippet label()}
      <p>Invite code</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="link-round" />
        <input bind:value={claim} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>Enter an invite code provided to you by the admin of the relay.</p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!claim || loading}>
      <Spinner {loading}>Request Access</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
