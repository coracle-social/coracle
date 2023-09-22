<script lang="ts">
  import {pluck, reject, propEq} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import type {Relay} from "src/engine"
  import {relays as knownRelays} from "src/engine"

  export let relays: Relay[]

  let q = ""
  let search

  const saveRelay = relay => {
    relays = relays.concat(relay)
  }

  const removeRelay = relay => {
    relays = reject(propEq("url", relay.url), relays)
  }

  $: joined = new Set(pluck("url", relays))

  $: search = fuzzy(
    $knownRelays.filter(r => !joined.has(r.url)),
    {keys: ["name", "description", "url"]}
  )
</script>

<Content>
  <div class="text-center">
    <Heading>Get Connected</Heading>
    <p>
      Nostr is a protocol, not a platform. This means that <i>you</i> choose where to store your data.
      Select your preferred storage relays below, or click "continue" to use some reasonable defaults.
      You can change your selection any time.
    </p>
  </div>
  <Anchor
    theme="button-accent"
    class="text-center"
    on:click={() => modal.replace({type: "onboarding", stage: "follows"})}>
    Continue
  </Anchor>
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
        <RelayCard {relay}>
          <div slot="actions">
            {#if relays.length > 1}
              <button
                class="flex items-center gap-3 text-gray-1"
                on:click={() => removeRelay(relay)}>
                <i class="fa fa-right-from-bracket" /> Leave
              </button>
            {/if}
          </div>
        </RelayCard>
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
    <RelayCard {relay}>
      <div slot="actions">
        <button class="flex items-center gap-3 text-gray-1" on:click={() => saveRelay(relay)}>
          <i class="fa fa-right-to-bracket" /> Join
        </button>
      </div>
    </RelayCard>
  {/each}
  <small class="text-center">
    Showing {Math.min($knownRelays.length - relays.length, 50)}
    of {$knownRelays.length - relays.length} known relays
  </small>
</Content>
