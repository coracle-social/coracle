<script lang="ts">
  import {writable} from "svelte/store"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import {publishProfile} from "src/engine"

  export let state
  export let setStage

  const nsecWarning = writable(null)

  const bypassNsecWarning = () => {
    nsecWarning.set(null)
    next({skipNsecWarning: true})
  }

  const prev = () => setStage("keys")

  const next = async ({skipNsecWarning = false} = {}) => {
    if (
      !skipNsecWarning &&
      Object.values(state.profile)
        .join(" ")
        .match(/\bnsec1.+/)
    ) {
      return nsecWarning.set(true)
    }

    loading = true

    try {
      await publishProfile(state.profile)

      setStage("follows")
    } finally {
      loading = true
    }
  }

  let loading = false
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    3/5
  </p>
  <p class="text-2xl font-bold">Give us something to go on!</p>
</div>
<p>Help people recognize you by setting up your profile.</p>
<Field label="Your Name">
  <Input type="text" name="name" class="flex-grow" bind:value={state.profile.name}>
    <i slot="before" class="fa-solid fa-user-astronaut" />
  </Input>
</Field>
<Field label="About You (optional)">
  <Textarea name="about" bind:value={state.profile.about} />
</Field>
<Field label="Profile Image (optional)">
  <ImageInput
    bind:value={state.profile.picture}
    icon="image-portrait"
    maxWidth={480}
    maxHeight={480} />
</Field>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow" {loading} on:click={() => next()}>Continue</Anchor>
</div>

{#if $nsecWarning}
  <NsecWarning onAbort={() => nsecWarning.set(null)} onBypass={bypassNsecWarning} />
{/if}
