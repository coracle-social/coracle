<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {
    createEvent,
    makeProfile,
    editProfile,
    createProfile,
    isPublishedProfile,
  } from "@welshman/util"
  import {pubkey, profilesByPubkey, publishThunk} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import InfoHandle from "@app/components/InfoHandle.svelte"
  import {pushModal, clearModals} from "@app/modal"
  import {pushToast} from "@app/toast"

  const values = $state({...($profilesByPubkey.get($pubkey!) || makeProfile())})

  const back = () => history.back()

  const saveEdit = () => {
    const relays = ctx.app.router.FromUser().getUrls()
    const template = isPublishedProfile(values)
      ? editProfile($state.snapshot(values))
      : createProfile($state.snapshot(values))
    const event = createEvent(template.kind, template)

    publishThunk({event, relays})
    pushToast({message: "Your profile has been updated!"})
    clearModals()
  }

  let file: File | undefined = $state()
</script>

<form class="col-4" onsubmit={preventDefault(saveEdit)}>
  <div class="flex justify-center py-2">
    <InputProfilePicture bind:file bind:url={values.picture} />
  </div>
  <Field>
    {#snippet label()}
      <p>Username</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="user-circle" />
        <input bind:value={values.name} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>About You</p>
    {/snippet}
    {#snippet input()}
      <textarea class="textarea textarea-bordered leading-4" rows="3" bind:value={values.about}>
      </textarea>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Nostr Address</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="map-point" />
        <input bind:value={values.nip05} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>
        <Button class="link" onclick={() => pushModal(InfoHandle)}>What is a nostr address?</Button>
      </p>
    {/snippet}
  </Field>
  <div class="mt-4 flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-neutral" onclick={back}>Discard Changes</Button>
    <Button type="submit" class="btn btn-primary">Save Changes</Button>
  </div>
</form>
