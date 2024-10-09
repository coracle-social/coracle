<script lang="ts">
  import {goto} from "$app/navigation"
  import {tryCatch} from "@welshman/lib"
  import {isRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {loadRelay} from "@welshman/app"
  import CardButton from "@lib/components/CardButton.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import InfoRelay from "@app/components/InfoRelay.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {addSpaceMembership} from "@app/commands"
  import {makeSpacePath} from "@app/routes"

  const back = () => history.back()

  const browse = () => goto("/discover")

  const joinRelay = async (url: string) => {
    url = normalizeRelayUrl(url)

    const relay = await loadRelay(url)

    if (!relay?.profile) {
      return pushToast({
        theme: "error",
        message: "Sorry, we weren't able to find that relay.",
      })
    }

    await addSpaceMembership(url)

    goto(makeSpacePath(url))
    pushToast({
      message: "Welcome to the space!",
    })
  }

  const join = async () => {
    loading = true

    try {
      await joinRelay(url)
    } finally {
      loading = false
    }
  }

  let url = ""
  let loading = false

  $: linkIsValid = Boolean(tryCatch(() => isRelayUrl(normalizeRelayUrl(url))))
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <div class="py-2">
    <h1 class="heading">Join a Space</h1>
    <p class="text-center">Enter an invite code below to join an existing space.</p>
  </div>
  <Field>
    <p slot="label">Invite code*</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="link-round" />
      <input bind:value={url} class="grow" type="text" />
    </label>
    <p slot="info">
      You can also directly join any relay by entering its URL here.
      <Button class="link" on:click={() => pushModal(InfoRelay)}>What is a relay?</Button>
    </p>
  </Field>
  <Button on:click={browse}>
    <CardButton>
      <div slot="icon"><Icon icon="compass" size={7} /></div>
      <div slot="title">Don't have an invite?</div>
      <div slot="info">Browse other spaces on the discover page.</div>
    </CardButton>
  </Button>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!linkIsValid || loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
