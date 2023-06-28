<script lang="ts">
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import {displayPerson} from "src/util/nostr"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingKey from "src/app/views/OnboardingKey.svelte"
  import OnboardingRelays from "src/app/views/OnboardingRelays.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {DEFAULT_FOLLOWS, social} from "src/system"
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
      social.updatePetnames(
        social.getUserFollows().map(pubkey => {
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

  onMount(() => {
    // Prime our database with some defaults
    network.loadPeople(DEFAULT_FOLLOWS, {
      relays: sampleRelays(user.getRelays()),
    })
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
