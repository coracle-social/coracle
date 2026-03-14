<script lang="ts">
  import {_} from "svelte-i18n"
  import {LONG_FORM} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {userFollows} from "src/engine"

  const tabs = ["🌐", "→"]

  let activeTab = "🌐"

  const setActiveTab = tab => {
    activeTab = tab
  }

  $: authors =
    !$pubkey || activeTab === "🌐"
      ? undefined
      : activeTab === "→"
        ? [...$userFollows]
        : undefined

  $: feed = authors
    ? {definition: [{kinds: [LONG_FORM], authors}]}
    : {definition: [{kinds: [LONG_FORM]}]}

  document.title = $_("menu.blog")
</script>

<FlexColumn>
  <div class="flex items-center gap-2">
    <i class="fa fa-newspaper fa-lg" />
    <h2 class="staatliches text-2xl">{$_("menu.blog")}</h2>
  </div>
  {#if $pubkey}
    <Tabs {tabs} {activeTab} {setActiveTab} />
  {/if}
  {#key activeTab}
    <Feed {feed} />
  {/key}
</FlexColumn>
