<script lang="ts">
  import {identity, partition} from "@welshman/lib"
  import {
    FeedType,
    makeIntersectionFeed,
    hasSubFeeds,
    getFeedArgs,
    isAuthorFeed,
    isScopeFeed,
    isTagFeed,
    isRelayFeed,
    isListFeed,
    isDVMFeed,
    makeListFeed,
    makeDVMFeed,
    makeScopeFeed,
    makeTagFeed,
    makeRelayFeed,
    Scope,
  } from "@welshman/feeds"
  import Icon from "src/partials/Icon.svelte"
  import SelectTiles from "src/partials/SelectTiles.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FeedFormAdvanced from "src/app/shared/FeedFormAdvanced.svelte"
  import FeedFormFilters from "src/app/shared/FeedFormFilters.svelte"

  export let feed
  export let onChange = null

  enum FormType {
    Advanced = "advanced",
    DVMs = "dvms",
    Lists = "lists",
    People = "people",
    Relays = "relays",
    Topics = "topics",
  }

  const normalize = feed => (isNormalized(feed) ? feed : [FeedType.Intersection, feed])

  const isPeopleFeed = f => isAuthorFeed(f) || isScopeFeed(f)

  const isTopicsFeed = f => isTagFeed(f) && f[1] === "#t"

  const isNormalized = feed =>
    feed[0] === FeedType.Intersection && getFeedArgs(feed).every(f => !hasSubFeeds(f))

  const removeSubFeed = condition => {
    feed = [feed[0], ...feed.slice(1).filter(f => !condition(f))]
  }

  const prependDefaultSubFeed = (condition, subFeed) => {
    if (!getFeedArgs(feed).some(condition)) {
      feed = feed.toSpliced(1, 0, subFeed)
    }

    feed = [feed[0], ...partition(condition, feed.slice(1)).flatMap(identity)]
  }

  const inferFormType = feed => {
    for (const subFeed of getFeedArgs(normalize(feed))) {
      if ([FeedType.Scope, FeedType.Author].includes(subFeed[0])) {
        return FormType.People
      }

      if (subFeed[0] === FeedType.Tag && subFeed[1] === "#t") {
        return FormType.Topics
      }

      if (subFeed[0] === FeedType.Relay) {
        return FormType.Relays
      }

      if (subFeed[0] === FeedType.List) {
        return FormType.Lists
      }

      if (subFeed[0] === FeedType.DVM) {
        return FormType.DVMs
      }
    }

    return FormType.Advanced
  }

  const onFormTypeChange = newFormType => {
    if (formType === newFormType) {
      return
    }

    // If we can't deal with the feed, clear it out
    if (!isNormalized(feed)) {
      feed = makeIntersectionFeed()
    }

    // Remove filters directly related to the previous type
    if (formType === FormType.People) {
      removeSubFeed(isPeopleFeed)
    } else if (formType === FormType.Topics) {
      removeSubFeed(isTopicsFeed)
    } else if (formType === FormType.Relays) {
      removeSubFeed(isRelayFeed)
    } else if (formType === FormType.Lists) {
      removeSubFeed(isListFeed)
    } else if (formType === FormType.DVMs) {
      removeSubFeed(isDVMFeed)
    }

    formType = newFormType

    // Add a default filter depending on the new form type
    if (formType === FormType.People) {
      prependDefaultSubFeed(isPeopleFeed, makeScopeFeed(Scope.Follows))
    } else if (formType === FormType.Topics) {
      prependDefaultSubFeed(isTopicsFeed, makeTagFeed("#t"))
    } else if (formType === FormType.Relays) {
      prependDefaultSubFeed(isRelayFeed, makeRelayFeed())
    } else if (formType === FormType.Lists) {
      prependDefaultSubFeed(isListFeed, makeListFeed())
    } else if (formType === FormType.DVMs) {
      prependDefaultSubFeed(isDVMFeed, makeDVMFeed({kind: 5300}))
    }

    onChange?.(feed)
  }

  const onFeedChange = newFeed => {
    feed = newFeed
    onChange?.(feed)
  }

  let formType = inferFormType(feed)

  $: formTypeOptions = [
    FormType.People,
    FormType.Topics,
    FormType.Relays,
    FormType.Lists,
    FormType.DVMs,
    FormType.Advanced,
  ]

  $: console.log(JSON.stringify(normalize(feed), null, 2))
</script>

<FlexColumn>
  <Card class="-mb-8">
    <FlexColumn small>
      <span class="staatliches text-lg">Choose a feed type</span>
      <SelectTiles
        class="grid-cols-2 xs:grid-cols-3 2xl:grid-cols-6"
        options={formTypeOptions}
        onChange={onFormTypeChange}
        value={formType}>
        <div slot="item" class="flex flex-col items-center" let:option let:active>
          {#if option === FormType.People}
            <Icon icon="people-nearby" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">People</span>
          {:else if option === FormType.Topics}
            <span class="flex h-12 w-12 items-center justify-center" class:text-accent={active}>
              <i class="fa fa-2xl fa-tags" />
            </span>
            <span class="staatliches text-2xl">Topics</span>
          {:else if option === FormType.Relays}
            <Icon icon="server" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">Relays</span>
          {:else if option === FormType.Lists}
            <span class="flex h-12 w-12 items-center justify-center" class:text-accent={active}>
              <i class="fa fa-2xl fa-bars-staggered" />
            </span>
            <span class="staatliches text-2xl">Lists</span>
          {:else if option === FormType.DVMs}
            <Icon icon="network" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">DVMs</span>
          {:else if option === FormType.Advanced}
            <span class="flex h-12 w-12 items-center justify-center" class:text-accent={active}>
              <i class="fa fa-2xl fa-cogs" />
            </span>
            <span class="staatliches text-2xl">Advanced</span>
          {/if}
        </div>
      </SelectTiles>
    </FlexColumn>
  </Card>
  <FlexColumn>
    {#if formType === FormType.Advanced}
      <FeedFormAdvanced {feed} onChange={onFeedChange} />
    {:else}
      <FeedFormFilters {feed} onChange={onFeedChange} />
    {/if}
  </FlexColumn>
</FlexColumn>
