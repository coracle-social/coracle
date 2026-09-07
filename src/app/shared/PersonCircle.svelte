<script lang="ts">
  import {Profiles} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PlaceholderCircle from "src/app/shared/PlaceholderCircle.svelte"

  export let pubkey

  const klass = $$props.class || "w-4 h-4"
  const profile = fromApp($app => $app.use(Profiles).one(pubkey))
</script>

{#if $profile?.picture()}
  <ImageCircle src={$profile.picture()} class={klass} />
{:else}
  <PlaceholderCircle {pubkey} class={klass} />
{/if}
