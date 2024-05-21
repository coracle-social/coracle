<script lang="ts">
  import {ucFirst} from "hurdak"
  import {remove} from "@welshman/lib"
  import {isGroupAddress, getAddress, getIdFilters, Address} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {noteKinds} from "src/util/nostr"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {makeFeed, readFeed} from "src/domain"
  import {hints, repository, canSign, deriveGroup, load} from "src/engine"

  export let address

  const group = deriveGroup(address)

  const mainFeed = feedFromFilter({kinds: remove(30402, noteKinds), "#a": [address]})

  const setActiveTab = tab => {
    activeTab = tab
    feed = feeds.find(f => f.name === activeTab).feed
  }

  let activeTab = "feed"
  let tabs = ["feed"]
  let feeds = [{name: "feed", feed: makeFeed({definition: mainFeed})}]
  let feed = makeFeed({definition: mainFeed})

  for (const feed of $group.feeds || []) {
    const [address, relay = "", name = ""] = feed.slice(1)

    if (!Address.isAddress(address)) {
      continue
    }

    const event = repository.getEvent(address)

    if (event) {
      feeds = feeds.concat({name, feed: readFeed(event)})
      tabs = tabs.concat(name)
    } else {
      const relays = hints
        .merge([hints.fromRelays([relay]), hints.FromPubkeys([Address.from(address).pubkey])])
        .getUrls()

      load({
        relays,
        filters: getIdFilters([address]),
        onEvent: e => {
          if (feeds.find(f => getAddress(e) === address)) {
            return
          }

          feeds = feeds.concat({name, feed: readFeed(e)})
          tabs = tabs.concat(name)
        },
      })
    }
  }
</script>

<FlexColumn large>
  {#if $canSign}
    <NoteCreateInline group={address} />
  {/if}
  {#if tabs.length > 1}
    <Tabs {tabs} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2">
        <div>{ucFirst(tab)}</div>
      </div>
    </Tabs>
  {/if}
  {#key feed}
    <Feed
      {feed}
      eager
      shouldListen
      contextAddress={address}
      skipNetwork={isGroupAddress(address)} />
  {/key}
</FlexColumn>
