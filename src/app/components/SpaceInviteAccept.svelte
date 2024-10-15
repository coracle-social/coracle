<script lang="ts">
  import {goto} from "$app/navigation"
  import {ctx, tryCatch} from "@welshman/lib"
  import {isRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import CardButton from "@lib/components/CardButton.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Confirm from "@lib/components/Confirm.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoRelay from "@app/components/InfoRelay.svelte"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {addSpaceMembership, attemptRelayAccess} from "@app/commands"
  import {makeSpacePath} from "@app/routes"

  const back = () => history.back()

  const browse = () => goto("/discover")

  const confirm = async (url: string) => {
    await addSpaceMembership(url)

    goto(makeSpacePath(url), {replaceState: true})

    pushToast({
      message: "Welcome to the space!",
    })
  }

  const joinRelay = async (invite: string) => {
    const [raw, claim] = invite.split("'")
    const url = normalizeRelayUrl(raw)
    const error = await attemptRelayAccess(url, claim)

    if (error) {
      return pushToast({theme: "error", message: error})
    }

    const connection = ctx.net.pool.get(url)

    if (connection.meta.lastAuth === 0) {
      pushModal(Confirm, {
        confirm: () => confirm(url),
        message: `This space does not appear to limit who can post to it. This can result
                  in a large amount of spam or other objectionable content. Continue?`,
      })
    } else {
      await confirm(url)
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

  let url = ""
  let loading = false

  $: linkIsValid = Boolean(tryCatch(() => isRelayUrl(normalizeRelayUrl(url))))
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <ModalHeader>
    <div slot="title">Join a Space</div>
    <div slot="info">Enter an invite code below to join an existing space.</div>
  </ModalHeader>
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
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!linkIsValid || loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
