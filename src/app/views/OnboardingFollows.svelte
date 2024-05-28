<script lang="ts">
  import {reject, without, uniq, remove} from "ramda"
  import {quantify} from "hurdak"
  import {fromPairs} from "@welshman/lib"
  import {Tags, getAddress} from "@welshman/util"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import type {Relay} from "src/engine"
  import {urlToRelay, createPeopleLoader, profileSearch, searchRelays} from "src/engine"

  export let relays
  export let follows
  export let setStage
  export let onboardingLists

  let listEvent
  let term = ""
  let showList
  let showSelections
  let showPersonSearch
  let showRelaySearch

  const {load: loadPeople} = createPeopleLoader()

  const prev = () => setStage("profile")
  const next = () => setStage("note")

  const openList = event => {
    listEvent = event
    showList = true
  }

  const closeList = l => {
    showList = false
  }

  const openSelections = () => {
    showSelections = true
  }

  const closeSelections = () => {
    showSelections = false
  }

  const addFollow = pubkey => {
    follows = [...follows, pubkey]
  }

  const removeFollow = pubkey => {
    follows = remove(pubkey, follows)
  }

  const followAll = listEvent => {
    follows = uniq([...follows, ...Tags.fromEvent(listEvent).values("p").valueOf()])
  }

  const unfollowAll = listEvent => {
    follows = without(Tags.fromEvent(listEvent).values("p").valueOf(), follows)
  }

  const removeRelay = url => {
    relays = reject((r: Relay) => r.url === url, relays)
  }

  const addRelay = url => {
    relays = [...relays, urlToRelay(url)]
  }

  const openPersonSearch = () => {
    showPersonSearch = true
  }

  const closePersonSearch = () => {
    term = ""
    showPersonSearch = false
  }

  const openRelaySearch = () => {
    showRelaySearch = true
  }

  const closeRelaySearch = () => {
    term = ""
    showRelaySearch = false
  }

  $: urls = relays.map(r => r.url)

  $: {
    if (showPersonSearch) {
      loadPeople(term)
    }
  }
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    3/4
  </p>
  <p class="text-2xl font-bold">Find your people</p>
</div>
<p>
  Pick a category to find some people to follow, or click <Anchor
    underline
    on:click={openSelections}>here</Anchor> to search for specific accounts.
</p>
<div class="grid grid-cols-1 gap-3 overflow-auto xs:grid-cols-2 sm:grid-cols-3">
  {#each onboardingLists as event (getAddress(event))}
    {@const {title = "", description = ""} = fromPairs(event.tags)}
    <Card
      class="relative flex min-w-[180px] cursor-pointer flex-col gap-2 rounded-2xl sm:aspect-square"
      on:click={() => openList(event)}>
      <p class="text-xl font-bold">{title}</p>
      <p class="pb-5">{description}</p>
      <div class="absolute bottom-4 text-neutral-200">
        {Tags.fromEvent(event).values("p").count()} people
      </div>
    </Card>
  {/each}
</div>
<div class="flex justify-between">
  <div class="flex items-center gap-2">
    <i class="fa fa-info-circle" />
    <span>Following {quantify(follows.length, "person", "people")}</span>
    <span>•</span>
    <span>{quantify(relays.length, "relay")}</span>
  </div>
  <Anchor underline on:click={openSelections}>View selections</Anchor>
</div>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow" on:click={() => next()}>Continue</Anchor>
</div>

{#if showList}
  {@const {title, description} = fromPairs(listEvent.tags)}
  {@const listPubkeys = Tags.fromEvent(listEvent).values("p").valueOf()}
  <Modal onEscape={closeList} canCloseAll={false}>
    <div class="flex items-center justify-between">
      <p class="text-2xl font-bold">{title}</p>
      {#if listPubkeys.every(pubkey => follows.includes(pubkey))}
        <Anchor button class="flex items-center gap-2" on:click={() => unfollowAll(listEvent)}>
          Unfollow all
        </Anchor>
      {:else}
        <Anchor button class="flex items-center gap-2" on:click={() => followAll(listEvent)}>
          Follow all
        </Anchor>
      {/if}
    </div>
    <p class="pb-5 text-lg">{description}</p>
    {#each listPubkeys as pubkey (pubkey)}
      <PersonSummary {pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if follows.includes(pubkey)}
            <Anchor button class="flex items-center gap-2" on:click={() => removeFollow(pubkey)}>
              <i class="fa fa-user-slash" /> Unfollow
            </Anchor>
          {:else}
            <Anchor
              button
              accent
              class="flex items-center gap-2"
              on:click={() => addFollow(pubkey)}>
              <i class="fa fa-user-plus" /> Follow
            </Anchor>
          {/if}
        </div>
      </PersonSummary>
    {/each}
  </Modal>
{/if}

{#if showSelections}
  <Modal onEscape={closeSelections} canCloseAll={false}>
    <Subheading>People you follow</Subheading>
    <p class="text-lg">
      These are the people you'll be following once you finish creating your account.
    </p>
    <div />
    {#if follows.length === 0}
      <div class="my-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        <span>No people selected</span>
      </div>
    {:else}
      {#each follows as pubkey (pubkey)}
        <PersonSummary {pubkey}>
          <div slot="actions" class="flex items-start justify-end">
            <Anchor button class="flex items-center gap-2" on:click={() => removeFollow(pubkey)}>
              <i class="fa fa-user-slash" /> Unfollow
            </Anchor>
          </div>
        </PersonSummary>
      {/each}
    {/if}
    <Anchor button on:click={openPersonSearch}>
      <i class="fa fa-search" />
      Search for more people
    </Anchor>
    <div />
    <Subheading>Relays you use</Subheading>
    <p class="text-lg">
      Relays are where content on nostr lives. Connecting to different relays can result in a
      different experience.
    </p>
    <div />
    {#if relays.length === 0}
      <div class="my-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        <span>No relays selected</span>
      </div>
    {:else}
      <FlexColumn small>
        {#each relays as relay (relay.url)}
          <RelayCard inert {relay}>
            <div slot="actions">
              <Anchor
                button
                class="flex items-center gap-2"
                on:click={() => removeRelay(relay.url)}>
                <i class="fa fa-right-from-bracket" /> Leave
              </Anchor>
            </div>
          </RelayCard>
        {/each}
      </FlexColumn>
    {/if}
    <Anchor button on:click={openRelaySearch}>
      <i class="fa fa-search" />
      Search for more relays
    </Anchor>
  </Modal>
{/if}

{#if showPersonSearch}
  <Modal onEscape={closePersonSearch} canCloseAll={false}>
    <Input bind:value={term}>
      <i slot="before" class="fa fa-search" />
    </Input>
    {#each $profileSearch.search(term).slice(0, 30) as pubkey (pubkey)}
      <PersonSummary {pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if follows.includes(pubkey)}
            <Anchor button class="flex items-center gap-2" on:click={() => removeFollow(pubkey)}>
              <i class="fa fa-user-slash" /> Unfollow
            </Anchor>
          {:else}
            <Anchor
              button
              accent
              class="flex items-center gap-2"
              on:click={() => addFollow(pubkey)}>
              <i class="fa fa-user-plus" /> Follow
            </Anchor>
          {/if}
        </div>
      </PersonSummary>
    {/each}
  </Modal>
{/if}

{#if showRelaySearch}
  <Modal onEscape={closeRelaySearch}>
    <Input bind:value={term}>
      <i slot="before" class="fa fa-search" />
    </Input>
    <FlexColumn small>
      {#each $searchRelays(term).slice(0, 30) as relay (relay.url)}
        <RelayCard inert {relay}>
          <div slot="actions">
            {#if urls.includes(relay.url)}
              <Anchor
                button
                class="flex items-center gap-2"
                on:click={() => removeRelay(relay.url)}>
                <i class="fa fa-right-from-bracket" /> Leave
              </Anchor>
            {:else}
              <Anchor button class="flex items-center gap-2" on:click={() => addRelay(relay.url)}>
                <i class="fa fa-right-to-bracket" /> Join
              </Anchor>
            {/if}
          </div>
        </RelayCard>
      {/each}
    </FlexColumn>
  </Modal>
{/if}
