<script lang="ts">
  import {reject} from "ramda"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import type {Profile} from "src/engine"
  import {Env, Nip02, user, Directory, Builder} from "src/app/engine"
  import {modal} from "src/partials/state"

  const {searchProfiles} = Directory
  const follows = Nip02.graph
    .key(user.getStateKey())
    .derived(g => (g ? g.petnames.map(t => t[1]) : []))

  if ($follows.length === 0) {
    user.setPetnames(Env.DEFAULT_FOLLOWS.map(Builder.mention))
  }

  let q = ""

  $: results = reject((p: Profile) => $follows.includes(p.pubkey), $searchProfiles(q))
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
  {#if $follows.length === 0}
    <div class="mt-8 flex items-center justify-center gap-2 text-center">
      <i class="fa fa-triangle-exclamation" />
      <span>No follows selected</span>
    </div>
  {:else}
    {#each $follows as pubkey (pubkey)}
      <PersonSummary {pubkey}>
        <div slot="actions">
          <Anchor
            theme="button"
            class="flex items-center gap-2"
            on:click={() => user.unfollow(pubkey)}>
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
      <div slot="actions">
        <Anchor
          theme="button-accent"
          class="flex items-center gap-2"
          on:click={() => user.follow(profile.pubkey)}>
          <i class="fa fa-user-plus" /> Follow
        </Anchor>
      </div>
    </PersonSummary>
  {/each}
</Content>
