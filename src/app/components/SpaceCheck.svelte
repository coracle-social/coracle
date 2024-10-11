<script lang="ts">
  import {onMount} from 'svelte'
  import {goto} from '$app/navigation'
  import {sleep} from '@welshman/lib'
  import {displayRelayUrl} from '@welshman/util'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {attemptRelayAccess} from '@app/commands'
  import {makeSpacePath} from '@app/routes'

  export let url

  const back = () => history.back()

  const next = () => goto(makeSpacePath(url))

  let error: string | undefined
  let loading = true

  onMount(async () => {
    ;[error] = await Promise.all([attemptRelayAccess(url), sleep(3000)])
    loading = false
  })
</script>

<form class="column gap-4" on:submit|preventDefault={next}>
  <ModalHeader>
    <div slot="title">Checking Space...</div>
    <div slot="info">
      Connecting you to to <span class="text-primary">{displayRelayUrl(url)}</span>
    </div>
  </ModalHeader>
  <div class="flex flex-col m-auto gap-4">
    {#if loading}
      <Spinner loading>Hold tight, we're checking your connection.</Spinner>
    {:else if error}
      <p>
        Oops! We ran into some problems:
      </p>
      <p class="card2 bg-alt">{error}</p>
      <p>
        If you're not sure what the error message means, you may
        need to contact the space administrator to get more information.
      </p>
    {:else}
      <p>
        Looking good, we were able to connect you to this space!
        Click below to continue when you're ready.
      </p>
    {/if}
  </div>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      Go to Space
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </Button>
  </ModalFooter>
</form>
