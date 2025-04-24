<script lang="ts">
  import {displayList} from "@welshman/lib"
  import {
    isScopeFeed,
    isRelayFeed,
    isListFeed,
    isLabelFeed,
    isAddressFeed,
    isDVMFeed,
    isKindFeed,
    isTagFeed,
    isIDFeed,
    isSearchFeed,
    isAuthorFeed,
    isCreatedAtFeed,
    hasSubFeeds,
    getFeedArgs,
  } from "@welshman/feeds"
  import {displayRelayUrl} from "@welshman/util"
  import {displayProfileByPubkey} from "@welshman/app"
  import {formatTimestampAsDate, pluralize, quantify} from "src/util/misc"
  import Chip from "src/partials/Chip.svelte"

  export let feed
  export let shallow = false

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayProfileByPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics =>
    topics.length === 1 ? `#${topics[0]}` : `${topics.length} topics`
</script>

<div class="inline-block">
  {#if hasSubFeeds(feed)}
    {#if shallow}
      <Chip class="mb-2 mr-2 inline-block">
        Custom {feed[0]} feed ({getFeedArgs(feed).length}) selections
      </Chip>
    {:else}
      {#each getFeedArgs(feed) as subFeed}
        <svelte:self shallow feed={subFeed} />
      {/each}
    {/if}
  {:else}
    <Chip class="mb-2 mr-2 inline-block">
      {#if isRelayFeed(feed)}
        {@const args = getFeedArgs(feed)}
        On {args.length === 1 ? displayRelayUrl(args[0]) : `${args.length} relays`}
      {:else if isListFeed(feed)}
        From {quantify(getFeedArgs(feed).length, "list")}
      {:else if isLabelFeed(feed)}
        From {quantify(getFeedArgs(feed).length, "collection")}
      {:else if isAddressFeed(feed) || isIDFeed(feed)}
        {quantify(getFeedArgs(feed).length, "event")}
      {:else if isDVMFeed(feed)}
        From {quantify(getFeedArgs(feed).length, "DVM")}
      {:else if isKindFeed(feed)}
        {@const kinds = getFeedArgs(feed)}
        {pluralize(kinds.length, "Kind")}
        {displayList(kinds)}
      {:else if isTagFeed(feed)}
        {@const [key, ...values] = getFeedArgs(feed)}
        {#if key === "#p"}
          Mentioning {displayPeople(values)}
        {:else if key === "#t"}
          Related to {displayTopics(values)}
        {:else if key === "#e" || key === "#a"}
          Tagging {pluralize(values.length, "event")}
        {:else}
          {pluralize(values.length, "other tag")}
        {/if}
      {:else if isCreatedAtFeed(feed)}
        {#each getFeedArgs(feed) as { since, until, relative }}
          {#if since && until}
            Between {formatTimestampAsDate(since)} and {formatTimestampAsDate(until)}
          {:else if since}
            From {formatTimestampAsDate(since)}
          {:else if until}
            Through {formatTimestampAsDate(until)}
          {/if}
        {/each}
      {:else if isSearchFeed(feed)}
        Containing {displayList(getFeedArgs(feed))}
      {:else if isScopeFeed(feed)}
        From {displayList(getFeedArgs(feed))}
      {:else if isAuthorFeed(feed)}
        From {displayPeople(getFeedArgs(feed))}
      {/if}
    </Chip>
  {/if}
</div>
