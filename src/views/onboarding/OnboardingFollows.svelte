<script lang="ts">
  import {without} from 'ramda'
  import {fuzzy} from "src/util/misc"
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Heading from 'src/partials/Heading.svelte'
  import Content from 'src/partials/Content.svelte'
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import database from 'src/agent/database'
  import {modal} from "src/app/ui"

  export let follows

  let q = ""
  let search

  const knownPeople = database.watch('people', t => t.all({'kind0.name:!nil': null}))

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
      To get you started, we’ve added some interesting people to your follow list.
      You can update your follows list at any time.
    </p>
    <Anchor
      type="button-accent"
      on:click={() => modal.set({type: 'onboarding', stage: 'complete'})}>
      Continue
    </Anchor>
  </Content>
  <div class="flex gap-2 items-center">
    <i class="fa fa-user-astronaut fa-lg" />
    <h2 class="staatliches text-2xl">Your follows</h2>
  </div>
  {#if follows.length === 0}
  <div class="text-center mt-8 flex gap-2 justify-center items-center">
    <i class="fa fa-triangle-exclamation" />
    <span>No follows selected</span>
  </div>
  {:else}

  {#each follows as pubkey}
  <PersonInfo person={database.getPersonWithFallback(pubkey)} {removePetname} />
  {/each}

  {/if}
  <div class="flex gap-2 items-center">
    <i class="fa fa-earth-asia fa-lg" />
    <h2 class="staatliches text-2xl">Other people</h2>
  </div>
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each search(q).slice(0, 50) as person (person.pubkey)}
  <PersonInfo {person} {addPetname} />
  {/each}
</Content>
