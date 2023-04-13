<script lang="ts">
  import type {CustomFeed} from "src/util/types"
  import {prop, objOf, find, propEq} from "ramda"
  import {quantify} from "hurdak/lib/hurdak"
  import {shuffle, synced} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {getUserFollows, getUserNetwork} from "src/agent/social"
  import {sampleRelays, getAllPubkeyWriteRelays, getUserReadRelays} from "src/agent/relays"
  import user from "src/agent/user"

  const {feeds} = user
  const defaultFeeds = [
    {id: "follows", name: "Follows", authors: "follows"},
    {id: "network", name: "Network", authors: "network"},
  ] as Array<CustomFeed>

  let modalIsOpen = false
  let activeTab = synced("views/Feeds/activeTab", "Follows")
  let actions = []
  let relays, filter, tabs, feed

  $: allFeeds = defaultFeeds.concat($feeds)

  $: {
    tabs = allFeeds.map(prop("name")).slice(0, 2)

    if (!tabs.includes($activeTab)) {
      tabs = tabs.concat($activeTab)
    } else if ($feeds.length > 0) {
      tabs = tabs.concat($feeds[0].name)
    }
  }

  $: {
    feed = find(propEq("name", $activeTab), allFeeds)

    if (!feed) {
      feed = allFeeds[0]
      $activeTab = feed.name
    }
  }

  $: {
    let {authors, topics} = feed

    if (authors === "follows") {
      authors = shuffle(getUserFollows()).slice(0, 256)
      relays = sampleRelays(getAllPubkeyWriteRelays(authors))
    } else if (authors === "network") {
      authors = shuffle(getUserNetwork()).slice(0, 256)
      relays = sampleRelays(getAllPubkeyWriteRelays(authors))
    } else if (feed.relays) {
      relays = feed.relays.map(objOf("url"))
    } else {
      relays = sampleRelays(getUserReadRelays())
    }

    // Separate notes and reactions into two queries since otherwise reactions dominate,
    // we never find their parents (or reactions are mostly to a few posts), and the feed sucks
    filter = [1, 7].map(kind => {
      const filter = {kinds: [kind]} as Record<string, any>

      if (authors) {
        filter.authors = authors
      }

      if (topics) {
        filter["#t"] = topics
      }

      return filter
    })
  }

  $: {
    actions = []

    actions.push({
      onClick: toggleModal,
      label: "Customize",
      icon: "cog",
    })
  }

  const setActiveTab = tab => {
    $activeTab = tab
  }

  const toggleModal = () => {
    modalIsOpen = !modalIsOpen
  }

  const createFeed = () => {
    modal.push({type: "feed/edit"})
  }

  const editFeed = feed => {
    modal.push({type: "feed/edit", feed})
  }

  const removeFeed = feed => {
    user.removeFeed(feed.id)
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
      {#if $feeds.length > 0}
        <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
          <i slot="trigger" class="fa fa-ellipsis-v cursor-pointer p-2" />
          <div
            slot="tooltip"
            class="flex flex-col items-start rounded border border-solid border-gray-8 bg-black">
            {#each $feeds as feed (feed.name)}
              <button
                class="w-full py-2 px-3 text-left hover:bg-gray-7"
                on:click={() => {
                  $activeTab = feed.name
                }}>
                <i class="fa fa-scroll fa-sm mr-1" />
                {feed.name}
              </button>
            {/each}
            <button on:click={toggleModal} class="w-full py-2 px-3 text-left hover:bg-gray-7">
              <i class="fa fa-cog fa-sm mr-1" /> Customize
            </button>
          </div>
        </Popover>
      {:else}
        <i class="fa fa-ellipsis-v cursor-pointer p-1" on:click={toggleModal} />
      {/if}
    </Tabs>
    {#key $activeTab}
      <Feed {relays} {filter} />
    {/key}
  </div>
</Content>

{#if modalIsOpen}
  <Modal onEscape={toggleModal}>
    <Content>
      <div class="flex items-center justify-between">
        <Heading>Custom Feeds</Heading>
        <Anchor type="button-accent" on:click={createFeed}>
          <i class="fa fa-plus" /> Feed
        </Anchor>
      </div>
      <p>
        You custom feeds are listed below. You can create new custom feeds by handing using the "add
        feed" button, or by clicking the <i class="fa fa-scroll px-1" /> icon that appears throughout
        Coracle.
      </p>
      {#each $feeds as feed (feed.name)}
        <div class="flex justify-start gap-3">
          <i
            class="fa fa-sm fa-trash cursor-pointer py-3"
            on:click|stopPropagation={() => removeFeed(feed)} />
          <div class="flex w-full justify-between">
            <div>
              <strong>{feed.name}</strong>
              <p>
                {feed.topics ? quantify(feed.topics.length, "topic") : ""}
                {feed.authors ? quantify(feed.authors.length, "author") : ""}
                {feed.relays ? quantify(feed.relays.length, "relay") : ""}
              </p>
            </div>
            <Anchor on:click={() => editFeed(feed)}>Edit</Anchor>
          </div>
        </div>
      {:else}
        <p class="text-center py-12">You don't have any custom feeds yet.</p>
      {/each}
    </Content>
  </Modal>
{/if}
