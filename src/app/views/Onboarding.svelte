<script lang="ts">
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import {closure} from "hurdak"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingKey from "src/app/views/OnboardingKey.svelte"
  import OnboardingRelays from "src/app/views/OnboardingRelays.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {loadPubkeys, publishNote} from "src/engine2"
  import {Env, Builder, user, Keys} from "src/app/engine"
  import {listenForNotifications} from "src/app/state"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}

  let petnames = closure(() => {
    if (Keys.keyState.get().length > 0) {
      return []
    }

    const petnames = user.getPetnames()

    if (petnames.length === 0) {
      for (const pubkey of Env.DEFAULT_FOLLOWS) {
        petnames.push(Builder.mention(pubkey))
      }
    }

    return petnames
  })

  let relays = closure(() => {
    const relays = user.getRelays()

    if (relays.length === 0) {
      for (const url of Env.DEFAULT_RELAYS) {
        relays.push({url, read: true, write: true})
      }
    }

    return relays
  })

  const signup = async noteContent => {
    Keys.login("privkey", privkey)

    // Wait for the published event to go through
    await user.setRelays(relays)

    // Re-save preferences now that we have a key and relays. Wait for them
    // to persist so we have the correct user preferences
    await Promise.all([
      user.setProfile(profile),
      user.setPetnames(petnames),
      noteContent && publishNote(noteContent),
    ])

    // Start our notifications listener
    listenForNotifications()

    // Close all modals
    modal.clear()

    // Go to our home page
    navigate("/notes")
  }

  onMount(() => {
    // Prime our database with some defaults
    loadPubkeys(Env.DEFAULT_FOLLOWS)
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
      <OnboardingRelays bind:relays />
    {:else if stage === "follows"}
      <OnboardingFollows bind:petnames />
    {:else if stage === "note"}
      <OnboardingNote {signup} />
    {/if}
  </div>
{/key}
