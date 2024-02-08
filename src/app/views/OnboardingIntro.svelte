<script lang="ts">
  import {appName} from 'src/partials/state'
  import Anchor from "src/partials/Anchor.svelte"

  export let setStage

  const tutorialUrl = "https://nostr.com/"
  const next = () => setStage("profile")
</script>

<div class="flex gap-3">
  <p class="bg-light rounded-full w-12 h-12 -mt-2 -ml-1 flex justify-center items-center text-lg">1/4</p>
  <p class="text-2xl font-bold">New to Nostr?</p>
</div>
<p class="sm:hidden">
  Take a moment to get acquainted with {appName} — or skip straight to account setup.
</p>
<p class="hidden sm:block">
  Learn about the protocol at your own pace by watching one of our tutorial videos.
</p>
<div class="flex gap-2 flex-col sm:flex-row">
  <Anchor class="relative aspect-[4/3] rounded-xl overflow-hidden flex justify-center items-center p-8 text-center sm:w-1/2">
    <div
      class="absolute inset-0 opacity-75 hover:opacity-100 transition-opacity"
      style="background: url('/images/jakob-owens-8tyCOqTqdqg-unsplash.png'" />
    <p class="relative staatliches text-5xl text-white">{appName} in 30 seconds</p>
  </Anchor>
  <Anchor class="relative aspect-[4/3] rounded-xl overflow-hidden justify-center items-center p-8 text-center sm:w-1/2 hidden sm:flex">
    <div
      class="absolute inset-0 opacity-75 hover:opacity-100 transition-opacity"
      style="background: url('/images/sean-105m46GatAg-unsplash.png'" />
    <p class="relative staatliches text-5xl text-white">{appName} deep dive</p>
  </Anchor>
</div>
<p>
  When you’re ready, click below and we’ll guide you through the process of creating an account.
</p>
<Anchor button accent class="text-center" on:click={next}>Let's go!</Anchor>
