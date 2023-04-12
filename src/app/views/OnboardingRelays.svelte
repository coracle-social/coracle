<script lang="ts">
  import {reject, always, pluck, propEq} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {watch} from "src/agent/db"

  export let relays

  let q = ""
  let search

  const knownRelays = watch("relays", t => t.all())

  const removeRelay = r => {
    relays = reject(propEq("url", r.url), relays)
  }

  const addRelay = r => {
    relays = relays.concat({...r, write: true})
  }

  $: joined = new Set(pluck("url", relays))
  $: search = fuzzy(
    $knownRelays.filter(r => !joined.has(r.url)),
    {keys: ["name", "description", "url"]}
  )
</script>

<Content>
  <Content class="text-center">
    <Heading>Get Connected</Heading>
    <p>
      Nostr is a protocol, not a platform. This means that <i>you</i> choose where to store your data.
      Select your preferred storage relays below, or click "continue" to use some reasonable defaults.
      You can change your selection any time.
    </p>
    <Anchor type="button-accent" on:click={() => modal.set({type: "onboarding", stage: "follows"})}>
      Continue
    </Anchor>
  </Content>
  <div class="flex items-center gap-2">
    <i class="fa fa-server fa-lg" />
    <h2 class="staatliches text-2xl">Your relays</h2>
  </div>
  {#if relays.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      <span>No relays connected</span>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each relays as relay (relay.url)}
        <RelayCard {relay} hasRelay={always(true)} {removeRelay} />
      {/each}
    </div>
  {/if}
  <div class="flex items-center gap-2">
    <i class="fa fa-earth-asia fa-lg" />
    <h2 class="staatliches text-2xl">Other relays</h2>
  </div>
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each (search(q) || []).slice(0, 50) as relay (relay.url)}
    <RelayCard {relay} hasRelay={always(false)} {addRelay} />
  {/each}
  <small class="text-center">
    Showing {Math.min($knownRelays.length - relays.length, 50)}
    of {$knownRelays.length - relays.length} known relays
  </small>
</Content>
