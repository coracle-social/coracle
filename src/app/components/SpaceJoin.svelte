<script lang="ts">
  import {goto} from '$app/navigation'
  import CardButton from '@lib/components/CardButton.svelte'
  import Field from '@lib/components/Field.svelte'
  import Icon from '@lib/components/Icon.svelte'
  import SpaceCreateFinish from '@app/components/SpaceCreateFinish.svelte'
  import {pushModal} from '@app/modal'

  const back = () => history.back()

  const browse = () => goto("/browse", {state: {}})

  const join = () => {}

  let link = ""

  $: linkIsValid = Boolean(link.match(/.+\..+'.+/))
</script>

<div class="column gap-4">
  <h1 class="heading">Join a Space</h1>
  <p class="text-center">
    Enter an invite link below to join an existing space.
  </p>
  <Field>
    <p slot="label">Invite Link*</p>
    <label class="input input-bordered w-full flex items-center gap-2" slot="input">
      <Icon icon="link-round" />
      <input bind:value={link} class="grow" type="text" />
    </label>
  </Field>
  <CardButton icon="compass" title="Don't have an invite?" on:click={browse}>
    Browse other spaces on the discover page.
  </CardButton>
  <div class="flex flex-row justify-between items-center gap-4">
    <button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </button>
    <button class="btn btn-primary" on:click={join} disabled={!linkIsValid}>
      Join Space
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </button>
  </div>
</div>
