<script lang="ts">
  import {uniq} from "ramda"
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import {shuffle} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingKey from "src/app/views/OnboardingKey.svelte"
  import OnboardingRelays from "src/app/views/OnboardingRelays.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {getFollows, defaultFollows} from "src/agent/social"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import network from "src/agent/network"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {keys} from "src/system"
  import cmd from "src/agent/cmd"
  import {loadAppData} from "src/app/state"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}
  const {relays} = user

  if ($relays.length === 0) {
    user.updateRelays(() =>
      (pool.forceUrls.length > 0 ? pool.forceUrls : pool.defaultUrls).map(url => ({
        url,
        write: true,
      }))
    )
  }

  const signup = async note => {
    await keys.login("privkey", privkey)

    // Re-save preferences now that we have a key
    await Promise.all([
      user.updateRelays(() => user.getRelays()),
      cmd.updateUser(profile).publish(user.getRelays()),
      note && cmd.createNote(note).publish(user.getRelays()),
      user.updatePetnames(() =>
        user.getPetnamePubkeys().map(pubkey => {
          const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))
          const name = displayPerson(getPersonWithFallback(pubkey))

          return ["p", pubkey, url, name]
        })
      ),
    ])

    loadAppData(user.getPubkey())

    modal.clear()
    navigate("/notes")
  }

  // Prime our people cache for hardcoded follows and a sample of people they follow
  onMount(async () => {
    const relays = sampleRelays(user.getRelays())
    const follows = user.getPetnamePubkeys().concat(defaultFollows)

    await network.loadPeople(follows, {relays})

    const others = shuffle(uniq(follows.flatMap(getFollows))).slice(0, 256)

    await network.loadPeople(others, {relays})
  })
</script>

{#key stage}
  <div in:fly={{y: 20}}>
    {#if stage === "intro"}
      <OnboardingIntro />
    {:else if stage === "profile"}
      <OnboardingProfile {profile} />
    {:else if stage === "key"}
      <OnboardingKey {privkey} />
    {:else if stage === "relays"}
      <OnboardingRelays />
    {:else if stage === "follows"}
      <OnboardingFollows />
    {:else if stage === "note"}
      <OnboardingNote {signup} />
    {/if}
  </div>
{/key}
