<script lang="ts">
  import {onMount} from "svelte"
  import {sleep} from "@welshman/lib"
  import {Pool, AuthStatus} from "@welshman/net"
  import {displayRelayUrl} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import SpaceVisitConfirm, {confirmSpaceVisit} from "@app/components/SpaceVisitConfirm.svelte"
  import {attemptRelayAccess} from "@app/commands"
  import {pushModal} from "@app/modal"

  const {url} = $props()

  const back = () => history.back()

  const next = () => {
    if (!error && Pool.get().get(url).auth.status === AuthStatus.None) {
      pushModal(SpaceVisitConfirm, {url}, {replaceState: true})
    } else {
      confirmSpaceVisit(url)
    }
  }

  let error: string | undefined = $state()
  let loading = $state(true)

  onMount(async () => {
    ;[error] = await Promise.all([attemptRelayAccess(url), sleep(3000)])
    loading = false
  })
</script>

<form class="column gap-4" onsubmit={preventDefault(next)}>
  <ModalHeader>
    {#snippet title()}
      <div>Checking Space...</div>
    {/snippet}
    {#snippet info()}
      <div>
        Connecting you to to <span class="text-primary">{displayRelayUrl(url)}</span>
      </div>
    {/snippet}
  </ModalHeader>
  <div class="m-auto flex flex-col gap-4">
    {#if loading}
      <Spinner loading>Hold tight, we're checking your connection.</Spinner>
    {:else if error}
      <p>Oops! We ran into some problems:</p>
      <p class="card2 bg-alt">{error}</p>
      <p>
        If you're not sure what the error message means, you may need to contact the space
        administrator to get more information.
      </p>
    {:else}
      <p>
        Looking good, we were able to connect you to this space! Click below to continue when you're
        ready.
      </p>
    {/if}
  </div>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      Go to Space
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
