<script lang="ts">
  import {isMobile} from "src/util/html"
  import {themeColors, appName} from "src/partials/state"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"

  export let setStage
  export let nstartCompleted

  const params = new URLSearchParams({
    an: appName,
    ac: window.location.origin,
    at: isMobile ? "android" : "web",
    aa: $themeColors.accent.slice(1),
    asf: "yes",
  })

  const nstart = `https://start.njump.me/?${params.toString()}`

  const prev = () => setStage("intro")

  const next = () => setStage("follows")
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    2/4
  </p>
  <p class="text-2xl font-bold">Create your Profile</p>
</div>
<p>
  To get you started, we'll redirect you to an app called <strong>nstart</strong>, which will guide
  you through the process of creating and securely storing your account keys.
</p>
<p>
  Nstart will also help you fill out your social profile, then when you're done you'll be sent back
  here to finish setting up your account.
</p>
<div class="flex gap-2">
  <Button class="btn" on:click={prev}><i class="fa fa-arrow-left" /> Back</Button>
  {#if nstartCompleted}
    <Button class="btn btn-accent flex-grow" on:click={next}>Continue</Button>
  {:else}
    <Link class="btn btn-accent flex-grow" href={nstart} external target="">Continue</Link>
  {/if}
</div>
