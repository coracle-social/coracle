<script lang="ts">
  import {prop, uniq, indexBy, objOf, filter as _filter} from "ramda"
  import {shuffle, synced} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {getUserFollows, getUserNetwork} from "src/agent/social"
  import {sampleRelays, getAllPubkeyWriteRelays, getUserReadRelays} from "src/agent/relays"
  import user from "src/agent/user"

  const {lists} = user
  const activeTab = synced("views/Feeds/activeTab", "Follows")

  let relays, filter, tabs

  $: listsByName = indexBy(l => Tags.from(l).getMeta("d"), $lists)
  $: {
    const defaultTabs = ["Follows", "Network"]
    const customTabs = Object.keys(listsByName)
    const validTabs = defaultTabs.concat(customTabs)

    if (!validTabs.includes($activeTab)) {
      $activeTab = validTabs[0]
    }

    tabs = uniq(defaultTabs.concat($activeTab).concat(customTabs)).slice(0, 3)
  }

  $: {
    if ($activeTab === "Follows") {
      const authors = shuffle(getUserFollows()).slice(0, 256)

      filter = {authors}
      relays = sampleRelays(getAllPubkeyWriteRelays(authors))
    } else if ($activeTab === "Network") {
      const authors = shuffle(getUserNetwork()).slice(0, 256)

      filter = {authors}
      relays = sampleRelays(getAllPubkeyWriteRelays(authors))
    } else {
      const list = listsByName[$activeTab]
      const tags = Tags.from(list)
      const authors = tags.type("p").values().all()
      const topics = tags.type("t").values().all()
      const urls = tags.type("r").values().all()

      filter = _filter(prop("length"), {authors, "#t": topics})
      relays = urls.length > 0 ? urls.map(objOf("url")) : sampleRelays(getUserReadRelays())
    }

    // Separate notes and reactions into two queries since otherwise reactions dominate,
    // we never find their parents (or reactions are mostly to a few posts), and the feed sucks
    filter = [1, 7].map(kind => ({...filter, kinds: [kind]}))
  }

  const setActiveTab = tab => {
    $activeTab = tab
  }

  const showLists = () => {
    modal.push({type: "list/list"})
  }

  document.title = $activeTab
</script>

<Content>
  {#if !user.getProfile()}
    <Content size="lg" class="text-center">
      <p class="text-xl">Don't have an account?</p>
      <p>
        Click <Anchor href="/login">here</Anchor> to join the nostr network.
      </p>
    </Content>
  {/if}
  <div>
    <Tabs {tabs} activeTab={$activeTab} {setActiveTab}>
      {#if $lists.length > 1}
        <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
          <i slot="trigger" class="fa fa-ellipsis-v cursor-pointer p-2" />
          <div
            slot="tooltip"
            class="flex flex-col items-start rounded border border-solid border-gray-8 bg-black">
            {#each $lists as e (e.id)}
              {@const meta = Tags.from(e).asMeta()}
              {#if meta.d !== $activeTab}
                <button
                  class="w-full py-2 px-3 text-left hover:bg-gray-7"
                  on:click={() => {
                    $activeTab = meta.d
                  }}>
                  <i class="fa fa-scroll fa-sm mr-1" />
                  {meta.d}
                </button>
              {/if}
            {/each}
            <button on:click={showLists} class="w-full py-2 px-3 text-left hover:bg-gray-7">
              <i class="fa fa-cog fa-sm mr-1" /> Customize
            </button>
          </div>
        </Popover>
      {:else}
        <i class="fa fa-ellipsis-v cursor-pointer p-1" on:click={showLists} />
      {/if}
    </Tabs>
    {#key $activeTab}
      <Feed {relays} {filter} />
    {/key}
  </div>
</Content>
