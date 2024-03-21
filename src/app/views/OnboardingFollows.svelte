<script lang="ts">
  import {reject, uniqBy, nth, identity} from "ramda"
  import {quantify} from "hurdak"
  import {Tags} from "paravel"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import type {Relay} from "src/engine"
  import {
    env,
    lists,
    urlToRelay,
    mention,
    createPeopleLoader,
    searchPeople,
    searchRelays,
  } from "src/engine"

  export let relays
  export let petnames
  export let setStage

  let list
  let term = ""
  let showList
  let showSelections
  let showPersonSearch
  let showRelaySearch

  const {load: loadPeople} = createPeopleLoader()

  const prev = () => setStage("profile")
  const next = () => setStage("note")

  const openList = l => {
    list = l
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
    petnames = [...petnames, mention(pubkey)]
  }

  const removeFollow = pubkey => {
    petnames = reject(t => t[1] === pubkey, petnames)
  }

  const followAll = list => {
    petnames = uniqBy(nth(1), [
      ...petnames,
      ...Tags.fromEvent(list).values("p").valueOf().map(mention),
    ])
  }

  const unfollowAll = list => {
    const pubkeys = Tags.fromEvent(list).values("p").valueOf()

    petnames = petnames.filter(t => !pubkeys.includes(t[1]))
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

  const onboardingLists = lists.mapStore.derived($lists =>
    $env.ONBOARDING_LISTS.map(a => $lists.get(a)).filter(identity),
  )

  $: urls = relays.map(r => r.url)

  $: pubkeys = petnames.map(t => t[1])

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
  {#each $onboardingLists as list (list.address)}
    <Card
      class="relative flex min-w-[180px] cursor-pointer flex-col gap-2 rounded-2xl sm:aspect-square"
      on:click={() => openList(list)}>
      <p class="text-xl font-bold">{list.title}</p>
      <p class="pb-5">{list.description}</p>
      <div class="absolute bottom-1 text-neutral-200">
        {Tags.fromEvent(list).values("p").count()} people
      </div>
    </Card>
  {/each}
</div>
<div class="flex justify-between">
  <div class="flex items-center gap-2">
    <i class="fa fa-info-circle" />
    <span>Following {quantify(pubkeys.length, "person", "people")}</span>
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
  {@const listPubkeys = Tags.fromEvent(list).values("p").valueOf()}
  <Modal onEscape={closeList} canCloseAll={false}>
    <div class="flex items-center justify-between">
      <p class="text-2xl font-bold">{list.title}</p>
      {#if listPubkeys.every(pubkey => pubkeys.includes(pubkey))}
        <Anchor button class="flex items-center gap-2" on:click={() => unfollowAll(list)}>
          Unfollow all
        </Anchor>
      {:else}
        <Anchor button class="flex items-center gap-2" on:click={() => followAll(list)}>
          Follow all
        </Anchor>
      {/if}
    </div>
    <p class="pb-5 text-lg">{list.description}</p>
    {#each listPubkeys as pubkey (pubkey)}
      <PersonSummary {pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if pubkeys.includes(pubkey)}
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
    {#if pubkeys.length === 0}
      <div class="my-8 flex items-center justify-center gap-2 text-center">
        <i class="fa fa-triangle-exclamation" />
        <span>No people selected</span>
      </div>
    {:else}
      {#each pubkeys as pubkey (pubkey)}
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
    {#each $searchPeople(term).slice(0, 30) as person (person.pubkey)}
      <PersonSummary pubkey={person.pubkey}>
        <div slot="actions" class="flex items-start justify-end">
          {#if pubkeys.includes(person.pubkey)}
            <Anchor
              button
              class="flex items-center gap-2"
              on:click={() => removeFollow(person.pubkey)}>
              <i class="fa fa-user-slash" /> Unfollow
            </Anchor>
          {:else}
            <Anchor
              button
              accent
              class="flex items-center gap-2"
              on:click={() => addFollow(person.pubkey)}>
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
