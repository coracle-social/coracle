<script lang="ts">
  import {FeedType, makeIntersectionFeed, hasSubFeeds, getFeedArgs} from "@welshman/feeds"
  import Icon from "src/partials/Icon.svelte"
  import SelectTiles from "src/partials/SelectTiles.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Field from "src/partials/Field.svelte"
  import FeedFormPeople from "src/app/shared/FeedFormPeople.svelte"
  import FeedFormTopics from "src/app/shared/FeedFormTopics.svelte"
  import FeedFormRelays from "src/app/shared/FeedFormRelays.svelte"
  import FeedFormDVMs from "src/app/shared/FeedFormDVMs.svelte"
  import FeedFormAdvanced from "src/app/shared/FeedFormAdvanced.svelte"

  export let feed
  export let onChange
  export let onCancel

  enum FormType {
    Advanced = "advanced",
    DVMs = "dvms",
    People = "people",
    Relays = "relays",
    Topics = "topics",
  }

  const normalize = feed => (isNormalized(feed) ? feed : [FeedType.Intersection, feed])

  const isNormalized = feed =>
    feed[0] === FeedType.Intersection && getFeedArgs(feed).every(f => !hasSubFeeds(f))

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

    formType = newFormType
  }

  const onFeedChange = newFeed => {
    feed = newFeed
  }

  let formType = inferFormType(feed)

  $: console.log(JSON.stringify(normalize(feed), null, 2))
</script>

<FlexColumn class="pb-32">
  <Card>
    <Field label="Choose a feed type">
      <SelectTiles
        options={[FormType.People, FormType.Topics, FormType.Relays, FormType.DVMs]}
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
          {:else if option === FormType.DVMs}
            <Icon icon="network" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">DVMs</span>
          {/if}
        </div>
      </SelectTiles>
    </Field>
    <div class="flex justify-end">
      <Anchor underline on:click={() => onFormTypeChange(FormType.Advanced)}>Advanced mode</Anchor>
    </div>
  </Card>
  {#if formType === FormType.People}
    <FeedFormPeople feed={normalize(feed)} onChange={onFeedChange} />
  {:else if formType === FormType.Topics}
    <FeedFormTopics feed={normalize(feed)} onChange={onFeedChange} />
  {:else if formType === FormType.Relays}
    <FeedFormRelays feed={normalize(feed)} onChange={onFeedChange} />
  {:else if formType === FormType.DVMs}
    <FeedFormDVMs feed={normalize(feed)} onChange={onFeedChange} />
  {:else if formType === FormType.Advanced}
    <FeedFormAdvanced {feed} onChange={onFeedChange} />
  {/if}
  <div class="flex items-center justify-between gap-3">
    <Anchor button on:click={onCancel}>Discard</Anchor>
    <Anchor button accent on:click={() => onChange(feed)}>Save feed</Anchor>
  </div>
</FlexColumn>
