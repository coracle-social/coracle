<script lang="ts">
  import type {Snippet} from "svelte"
  import type {Profile} from "@welshman/util"
  import {makeProfile} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import InfoHandle from "@app/components/InfoHandle.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    initialValues?: Profile
    onsubmit: (profile: Profile) => void
    hideAddress?: boolean
    footer: Snippet
  }

  const {initialValues = makeProfile(), hideAddress, onsubmit, footer}: Props = $props()

  const values = $state(initialValues)

  const submit = () => onsubmit($state.snapshot(values))

  let file: File | undefined = $state()
</script>

<form class="col-4" onsubmit={preventDefault(submit)}>
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
    {#snippet info()}
      What would you like people to call you?
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>About You</p>
    {/snippet}
    {#snippet input()}
      <textarea class="textarea textarea-bordered leading-4" rows="3" bind:value={values.about}
      ></textarea>
    {/snippet}
    {#snippet info()}
      Give a brief introduction to why you're here.
    {/snippet}
  </Field>
  {#if !hideAddress}
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
          <Button class="link" onclick={() => pushModal(InfoHandle)}
            >What is a nostr address?</Button>
        </p>
      {/snippet}
    </Field>
  {/if}
  {@render footer()}
</form>
