<script lang="ts">
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"

  export let profile
  export let setStage

  const prev = () => setStage("intro")
  const next = () => setStage("key")
</script>

<Content size="lg">
  <Heading class="text-center">Introduce Yourself</Heading>
  <p class="text-center">
    Give other people something to go on. Remember that "privacy is the power to selectively reveal
    oneself to the world".
  </p>
  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-1">
      <strong>Your Name</strong>
      <Input type="text" name="name" wrapperClass="flex-grow" bind:value={profile.name}>
        <i slot="before" class="fa-solid fa-user-astronaut" />
      </Input>
    </div>
    <div class="flex flex-col gap-1">
      <strong>About You</strong>
      <Textarea name="about" bind:value={profile.about} />
    </div>
    <div class="flex flex-col gap-1">
      <strong>Profile Picture</strong>
      <ImageInput
        bind:value={profile.picture}
        icon="image-portrait"
        maxWidth={480}
        maxHeight={480} />
      <p class="text-sm text-gray-1">Please be mindful of others and only use small images.</p>
    </div>
  </div>
  <div class="flex gap-2">
    <Anchor theme="button" on:click={prev}><i class="fa fa-arrow-left" /></Anchor>
    <Anchor theme="button-accent" class="flex-grow text-center" on:click={next}>Continue</Anchor>
  </div>
</Content>
