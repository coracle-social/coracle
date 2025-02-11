<script lang="ts">
  import {isMobile} from "src/util/html"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let setStage

  let media

  const ac = window.location.origin
  const at = isMobile ? "android" : "web"
  const njump = `https://start.njump.me/?an=Coracle&at=${at}&ac=${ac}`

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
  <Anchor
    class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl p-8 text-center sm:w-1/2"
    on:click={() => openMedia("https://coracle.us-southeast-1.linodeobjects.com/coracle-30s.mp4")}>
    <div
      class="absolute inset-0 opacity-75 transition-opacity hover:opacity-100"
      style="background: url('/images/jakob-owens-8tyCOqTqdqg-unsplash.png'" />
    <p class="staatliches relative text-5xl text-white">Nostr in 30 seconds</p>
  </Anchor>
  <Anchor
    class="relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-xl p-8 text-center sm:flex sm:w-1/2"
    on:click={() =>
      openMedia("https://coracle.us-southeast-1.linodeobjects.com/coracle-deep-dive.mp4")}>
    <div
      class="absolute inset-0 opacity-75 transition-opacity hover:opacity-100"
      style="background: url('/images/sean-105m46GatAg-unsplash.png'" />
    <p class="staatliches relative text-5xl text-white">{appName} deep dive</p>
  </Anchor>
</div>
<p>
  When you’re ready, click below and we’ll guide you through the process of creating an account.
</p>
<Anchor button accent class="text-center" on:click={next}>Let's go!</Anchor>
<p class="text-center text-sm opacity-75">
  You can also try nostr's dedicated onboarding experience over at
  <Anchor underline external href={njump}>njump</Anchor>.
</p>

{#if media}
  <Modal onEscape={closeMedia}>
    <Media url={media || ""} />
  </Modal>
{/if}
