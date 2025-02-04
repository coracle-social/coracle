<script lang="ts">
  import {goto} from "$app/navigation"
  import {ctx, tryCatch} from "@welshman/lib"
  import {isRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {preventDefault} from "@lib/html"
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

  const confirm = async (url: string) => {
    await addSpaceMembership(url)

    goto(makeSpacePath(url), {replaceState: true})

    pushToast({
      message: "Welcome to the space!",
    })
  }

  const joinRelay = async (invite: string) => {
    const [raw, claim] = invite.split("|")
    const url = normalizeRelayUrl(raw)
    const error = await attemptRelayAccess(url, claim)

    if (error) {
      return pushToast({theme: "error", message: error})
    }

    const connection = ctx.net.pool.get(url)

    if (connection.stats.lastAuth === 0) {
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
