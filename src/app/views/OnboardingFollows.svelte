<script lang="ts">
  import {fromPairs, uniq, without, remove, append, nth, nthNe} from "@welshman/lib"
  import {getPubkeyTagValues, getAddress, FOLLOWS} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {relaySearch, profileSearch, tagPubkey} from "@welshman/app"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {createPeopleLoader, createAndPublish, setOutboxPolicies} from "src/engine"
  import {quantify} from "src/util/misc"

  export let state
  export let setStage

  let loading = false
  let listEvent
  let term = ""
  let showList
  let showSelections
  let showPersonSearch
  let showRelaySearch

  const {load: loadPeople} = createPeopleLoader()

  const prev = () => setStage("keys")

  const next = async () => {
    loading = true

    try {
      // Publish relays
      await setOutboxPolicies(() => state.relays)

      // Publish follows
      await createAndPublish({
        kind: FOLLOWS,
        tags: state.follows.map(tagPubkey),
        relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
      })
    } finally {
      loading = false
    }

    setStage("note")
  }

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
    state.follows = append(pubkey, state.follows)
  }

  const removeFollow = pubkey => {
    state.follows = remove(pubkey, state.follows)
  }

  const followAll = listEvent => {
    state.follows = uniq([...state.follows, ...getPubkeyTagValues(listEvent.tags)])
  }

  const unfollowAll = listEvent => {
    state.follows = without(getPubkeyTagValues(listEvent.tags), state.follows)
  }

  const removeRelay = url => {
    state.relays = state.relays.filter(nthNe(1, url))
  }

  const addRelay = url => {
    state.relays = [...state.relays, ["r", url]]
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

  $: urls = state.relays.map(nth(1))

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
    on:click={openPersonSearch}>here</Anchor> to search for specific accounts.
</p>
<div class="grid grid-cols-1 gap-3 overflow-auto xs:grid-cols-2 sm:grid-cols-3">
  {#each state.onboardingLists as event (getAddress(event))}
    {@const {title = "", description = ""} = fromPairs(event.tags)}
    <Card
      class="relative flex min-w-[180px] cursor-pointer flex-col gap-2 rounded-2xl sm:aspect-square"
      on:click={() => openList(event)}>
      <p class="text-xl font-bold">{title}</p>
      <p class="pb-5">{description}</p>
      <div class="absolute bottom-4 text-neutral-200">
        {getPubkeyTagValues(event.tags).length} people
      </div>
    </Card>
  {/each}
</div>
<div class="flex justify-between">
  <div class="flex items-center gap-2">
    <i class="fa fa-info-circle" />
    <span>Following {quantify(state.follows.length, "person", "people")}</span>
    <span>•</span>
    <span>{quantify(state.relays.length, "relay")}</span>
  </div>
  <Anchor underline on:click={openSelections}>View selections</Anchor>
</div>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow" {loading} on:click={next}>Continue</Anchor>
</div>

{#if showList}
  {@const {title, description} = fromPairs(listEvent.tags)}
  {@const listPubkeys = uniq(getPubkeyTagValues(listEvent.tags))}
  <Modal onEscape={closeList} canCloseAll={false}>
    <div class="flex items-center justify-between">
      <p class="text-2xl font-bold">{title}</p>
      {#if listPubkeys.every(pubkey => state.follows.includes(pubkey))}
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
      <PersonSummary hideFollowActions {pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if state.follows.includes(pubkey)}
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
    {#if state.follows.length === 0}
      <div class="my-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        <span>No people selected</span>
      </div>
    {:else}
      {#each state.follows as pubkey (pubkey)}
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
    {#if state.relays.length === 0}
      <div class="my-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        <span>No relays selected</span>
      </div>
    {:else}
      <FlexColumn small>
        {#each state.relays as [_, url] (url)}
          <RelayCard {url}>
            <div slot="actions">
              <Anchor button class="flex items-center gap-2" on:click={() => removeRelay(url)}>
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
    <Input bind:value={term} placeholder="Search for people...">
      <i slot="before" class="fa fa-search" />
    </Input>
    {#each $profileSearch.searchValues(term).slice(0, 30) as pubkey (pubkey)}
      <PersonSummary hideFollowActions {pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if state.follows.includes(pubkey)}
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
      {#each $relaySearch.searchValues(term).slice(0, 30) as url (url)}
        <RelayCard {url}>
          <div slot="actions">
            {#if urls.includes(url)}
              <Anchor button class="flex items-center gap-2" on:click={() => removeRelay(url)}>
                <i class="fa fa-right-from-bracket" /> Leave
              </Anchor>
            {:else}
              <Anchor button class="flex items-center gap-2" on:click={() => addRelay(url)}>
                <i class="fa fa-right-to-bracket" /> Join
              </Anchor>
            {/if}
          </div>
        </RelayCard>
      {/each}
    </FlexColumn>
  </Modal>
{/if}
