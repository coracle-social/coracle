<script lang="ts">
  import {reject} from "ramda"
  import {displayPerson} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {DEFAULT_FOLLOWS, social} from "src/system"
  import {getPersonWithFallback, searchPeople} from "src/agent/db"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {modal} from "src/partials/state"
  import user from "src/agent/user"

  const {petnamePubkeys} = user

  if ($petnamePubkeys.length === 0) {
    social.updatePetnames(
      DEFAULT_FOLLOWS.map(pubkey => {
        const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))
        const name = displayPerson(getPersonWithFallback(pubkey))

        return ["p", pubkey, url, name]
      })
    )
  }

  let q = ""

  $: results = reject(p => $petnamePubkeys.includes(p.pubkey), $searchPeople(q))
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
  {#if $petnamePubkeys.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      <span>No follows selected</span>
    </div>
  {:else}
    {#each $petnamePubkeys as pubkey}
      <PersonInfo person={getPersonWithFallback(pubkey)} />
    {/each}
  {/if}
  <div class="flex items-center gap-2">
    <i class="fa fa-earth-asia fa-lg" />
    <h2 class="staatliches text-2xl">Other people</h2>
  </div>
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each results.slice(0, 50) as person (person.pubkey)}
    <PersonInfo {person} />
  {/each}
</Content>
