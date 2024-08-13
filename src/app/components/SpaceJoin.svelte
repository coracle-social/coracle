<script lang="ts">
  import {goto} from '$app/navigation'
  import CardButton from '@lib/components/CardButton.svelte'
  import Button from "@lib/components/Button.svelte"
  import Field from '@lib/components/Field.svelte'
  import Icon from '@lib/components/Icon.svelte'
  import SpaceCreateFinish from '@app/components/SpaceCreateFinish.svelte'
  import {pushModal} from '@app/modal'
  import {pushToast} from '@app/toast'
  import {GROUP_DELIMITER, splitGroupId, loadRelay, loadGroup} from '@app/state'

  const back = () => history.back()

  const browse = () => goto("/browse", {state: {}})

  const tryJoin = async () => {
    const [url, nom] = splitGroupId(id)

    const info = await loadRelay(url)

    if (!info) {
      return pushToast({
        theme: "error",
        message: "Sorry, we weren't able to find that relay."
      })
    }

    if (!info.supported_nips?.includes(29)) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that relay doesn't support nostr groups."
      })
    }

    const group = await loadGroup(id)
  }

  const join = async () => {
    loading = true

    try {
      await tryJoin()
    } finally {
      loading = false
    }
  }

  let id = "wss://devrelay.highlighter.com'group628195"
  let loading = false

  $: linkIsValid = Boolean(id.match(/.+\..+'.+/))
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <div class="py-2">
    <h1 class="heading">Join a Space</h1>
    <p class="text-center">
      Enter an invite link below to join an existing space.
    </p>
  </div>
  <Field>
    <p slot="label">Invite Link*</p>
    <label class="input input-bordered w-full flex items-center gap-2" slot="input">
      <Icon icon="link-round" />
      <input bind:value={id} class="grow" type="text" />
    </label>
  </Field>
  <CardButton icon="compass" title="Don't have an invite?" on:click={browse}>
    Browse other spaces on the discover page.
  </CardButton>
  <div class="flex flex-row justify-between items-center gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!linkIsValid || loading}>
      <span class="loading loading-spinner opacity-0" class:opacity-100={loading} />
      Join Space
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
