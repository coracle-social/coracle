<script lang="ts">
  import {preventDefault} from "@lib/html"
  import InputProfilePicture from "@lib/components/InputProfilePicture.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoRelay from "@app/components/InfoRelay.svelte"
  import SpaceCreateFinish from "@app/components/SpaceCreateFinish.svelte"
  import {pushModal} from "@app/modal"

  const back = () => history.back()

  const next = () => pushModal(SpaceCreateFinish)

  let file: File | undefined = $state()
  let name = $state("")
  let relay = $state("")
</script>

<form class="column gap-4" onsubmit={preventDefault(next)}>
  <ModalHeader>
    {#snippet title()}
      <div>Customize your Space</div>
    {/snippet}
    {#snippet info()}
      <div>Give people a few details to go on. You can always change this later.</div>
    {/snippet}
  </ModalHeader>
  <div class="flex justify-center py-2">
    <InputProfilePicture bind:file />
  </div>
  <Field>
    {#snippet label()}
      <p>Space Name</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="fire-minimalistic" />
        <input bind:value={name} class="grow" type="text" />
      </label>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Relay</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="server" />
        <input bind:value={relay} class="grow" type="text" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>
        This can be any nostr relay where you'd like to host your space.
        <Button class="link" onclick={() => pushModal(InfoRelay)}>What is a relay?</Button>
      </p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">
      Next
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
