<script lang="ts">
  import {without, always} from "ramda"
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {getPersonWithFallback} from "src/agent/db"
  import {watch} from "src/agent/db"
  import {modal} from "src/partials/state"

  export let follows

  let q = ""
  let search

  const knownPeople = watch("people", t => t.all({"kind0.name": {$type: "string"}}))

  $: search = fuzzy(
    $knownPeople.filter(p => !follows.includes(p.pubkey)),
    {keys: ["kind0.name", "kind0.about", "pubkey"]}
  )

  const removePetname = ({pubkey}) => {
    follows = without([pubkey], follows)
  }

  const addPetname = ({pubkey}) => {
    follows = follows.concat(pubkey)
  }
</script>

<Content>
  <Content class="text-center">
    <Heading>Find Your People</Heading>
    <p>
      To get you started, we’ve added some interesting people to your follow list. You can update
      your follows list at any time.
    </p>
    <Anchor
      type="button-accent"
      on:click={() => modal.push({type: "onboarding", stage: "complete"})}>
      Continue
    </Anchor>
  </Content>
  <div class="flex items-center gap-2">
    <i class="fa fa-user-astronaut fa-lg" />
    <h2 class="staatliches text-2xl">Your follows</h2>
  </div>
  {#if follows.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      <span>No follows selected</span>
    </div>
  {:else}
    {#each follows as pubkey}
      <PersonInfo
        person={getPersonWithFallback(pubkey)}
        hasPetname={always(true)}
        {removePetname} />
    {/each}
  {/if}
  <div class="flex items-center gap-2">
    <i class="fa fa-earth-asia fa-lg" />
    <h2 class="staatliches text-2xl">Other people</h2>
  </div>
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each search(q).slice(0, 50) as person (person.pubkey)}
    <PersonInfo {person} hasPetname={always(false)} {addPetname} />
  {/each}
</Content>
