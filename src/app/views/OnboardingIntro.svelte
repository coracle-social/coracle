<script lang="ts">
  import {appName} from "src/partials/state"
  import MediaVideo from "src/partials/MediaVideo.svelte"
  import Button from "src/partials/Button.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let setStage

  let media

  const next = () => setStage("keys")

  const openMedia = url => {
    media = url
  }

  const closeMedia = () => {
    media = null
  }
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    1/4
  </p>
  <p class="text-2xl font-bold">New to Nostr?</p>
</div>
<p class="sm:hidden">
  Take a moment to get acquainted with {appName} — or skip straight to account setup.
</p>
<p class="hidden sm:block">
  Learn about the protocol at your own pace by watching one of our tutorial videos.
</p>
<div class="flex flex-col gap-2 sm:flex-row">
  <Button
    class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl p-8 text-center sm:w-1/2"
    on:click={() => openMedia("https://coracle.us-southeast-1.linodeobjects.com/coracle-30s.mp4")}>
    <div
      class="absolute inset-0 opacity-75 transition-opacity hover:opacity-100"
      style="background: url('/images/jakob-owens-8tyCOqTqdqg-unsplash.png'" />
    <p class="staatliches relative text-5xl text-white">Nostr in 30 seconds</p>
  </Button>
  <Button
    class="relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-xl p-8 text-center sm:flex sm:w-1/2"
    on:click={() =>
      openMedia("https://coracle.us-southeast-1.linodeobjects.com/coracle-deep-dive.mp4")}>
    <div
      class="absolute inset-0 opacity-75 transition-opacity hover:opacity-100"
      style="background: url('/images/sean-105m46GatAg-unsplash.png'" />
    <p class="staatliches relative text-5xl text-white">{appName} deep dive</p>
  </Button>
</div>
<p>
  When you’re ready, click below and we’ll guide you through the process of creating an account.
</p>
<Button class="btn btn-accent text-center" on:click={next}>Let's go!</Button>

{#if media}
  <Modal onEscape={closeMedia}>
    <MediaVideo url={media || ""} />
  </Modal>
{/if}
