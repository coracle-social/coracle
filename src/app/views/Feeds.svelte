<script lang="ts">
  import {_} from "svelte-i18n"
  import {pubkey} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {defaultFeed} from "src/engine"

  export let feed = null

  const showLogin = () => router.at("login").open()

  const initialFeed = feed || $defaultFeed

  document.title = "Feeds"
</script>

{#if !$pubkey}
  <div class="py-16 text-center">
    <p class="text-xl">{$_("feeds.noAccount")}</p>
    <p>
      {$_("feeds.clickHere", {values: {link: "∅"}}).split("∅")[0]}<Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={showLogin}>{$_("common.here")}</Button>{$_("feeds.clickHere", {values: {link: "∅"}}).split("∅")[1]}
    </p>
  </div>
{/if}

<Feed showControls feed={initialFeed} />
