<script lang="ts">
  import {isMobile} from "src/util/html"
  import {pubkey} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"

  export let setStage

  const ac = window.location.origin
  const at = isMobile ? "android" : "web"
  const njump = `https://start.njump.me/?an=Coracle&at=${at}&ac=${ac}&asf=yes`

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
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  {#if $pubkey}
    <Anchor button accent class="flex-grow" on:click={next}>Continue</Anchor>
  {:else}
    <Anchor button accent class="flex-grow" externalHref={njump}>Continue</Anchor>
  {/if}
</div>
