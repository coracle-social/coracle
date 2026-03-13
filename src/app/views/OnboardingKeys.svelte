<script lang="ts">
  import {_} from "svelte-i18n"
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
    {$_("onboarding.step2")}
  </p>
  <p class="text-2xl font-bold">{$_("onboarding.createProfile")}</p>
</div>
<p>
  {@html $_("onboarding.nstartDescription")}
</p>
<p>
  {$_("onboarding.nstartHelp")}
</p>
<div class="flex gap-2">
  <Button class="btn" on:click={prev}><i class="fa fa-arrow-left" /> {$_("common.back")}</Button>
  {#if nstartCompleted}
    <Button class="btn btn-accent flex-grow" on:click={next}>{$_("common.continue")}</Button>
  {:else}
    <Link class="btn btn-accent flex-grow" href={nstart} external target=""
      >{$_("common.continue")}</Link>
  {/if}
</div>
