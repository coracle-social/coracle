<script lang="ts">
  import {reject} from "ramda"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import type {Person} from "src/engine"
  import {env, mention, loadPeople, searchPeople} from "src/engine"

  export let petnames
  export let setStage

  const prev = () => setStage("profile")
  const next = () => setStage("note")

  const addFollow = pubkey => {
    petnames = [...petnames, mention(pubkey)]
  }

  const removeFollow = pubkey => {
    petnames = reject(t => t[1] === pubkey, petnames)
  }

  let q = ""

  $: loadPeople(q)
  $: pubkeys = petnames.map(t => t[1])
  $: results = reject((p: Person) => pubkeys.includes(p.pubkey), $searchPeople(q))
</script>

<div class="flex gap-3">
  <p class="bg-light rounded-full w-12 h-12 -mt-2 -ml-1 flex justify-center items-center text-lg">3/4</p>
  <p class="text-2xl font-bold">Find your people</p>
</div>
<p>Search for people and topics, or browse our top suggestions below.</p>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /></Anchor>
  <Anchor button accent class="flex-grow" on:click={next}>Continue</Anchor>
</div>
<div class="flex items-center gap-2">
  <i class="fa fa-user-astronaut fa-lg" />
  <h2 class="staatliches text-2xl">Your follows</h2>
</div>
{#if pubkeys.length === 0}
  <div class="mt-8 flex items-center justify-center gap-2 text-center">
    <i class="fa fa-triangle-exclamation" />
    <span>No follows selected</span>
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
<div class="flex items-center gap-2">
  <i class="fa fa-earth-asia fa-lg" />
  <h2 class="staatliches text-2xl">Other people</h2>
</div>
<Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
  <i slot="before" class="fa-solid fa-search" />
</Input>
{#each results.slice(0, 50) as profile (profile.pubkey)}
  <PersonSummary pubkey={profile.pubkey}>
    <div slot="actions" class="flex items-start justify-end">
      <Anchor button accent on:click={() => addFollow(profile.pubkey)}>
        <i class="fa fa-user-plus" /> Follow
      </Anchor>
    </div>
  </PersonSummary>
{/each}
