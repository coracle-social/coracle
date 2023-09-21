<script lang="ts">
  import {reject} from "ramda"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import type {Person} from "src/engine"
  import {mention, searchPeople} from "src/engine"
  import {modal} from "src/partials/state"

  export let petnames

  const addFollow = pubkey => {
    petnames = [...petnames, mention(pubkey)]
  }

  const removeFollow = pubkey => {
    petnames = reject(t => t[1] === pubkey, petnames)
  }

  let q = ""

  $: pubkeys = petnames.map(t => t[1])
  $: results = reject((p: Person) => pubkeys.includes(p.pubkey), $searchPeople(q))
</script>

<Content>
  <Content class="text-center">
    <Heading>Find Your People</Heading>
    <p>
      To get you started, we’ve added some interesting people to your follow list. You can update
      your follows list at any time.
    </p>
    <Anchor
      theme="button-accent"
      on:click={() => modal.replace({type: "onboarding", stage: "note"})}>
      Continue
    </Anchor>
  </Content>
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
          <Anchor
            theme="button"
            class="flex items-center gap-2"
            on:click={() => removeFollow(pubkey)}>
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
        <Anchor
          theme="button-accent"
          class="flex items-center gap-2"
          on:click={() => addFollow(profile.pubkey)}>
          <i class="fa fa-user-plus" /> Follow
        </Anchor>
      </div>
    </PersonSummary>
  {/each}
</Content>
