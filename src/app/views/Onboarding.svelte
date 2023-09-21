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
  import {
    env,
    user,
    mention,
    session,
    loadPubkeys,
    publishNote,
    publishPetnames,
    publishProfile,
    publishRelays,
    loginWithPrivateKey,
    listenForNotifications,
  } from "src/engine"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}

  let petnames = closure(() => {
    if ($session) {
      return []
    }

    const {petnames} = user.get()

    if (petnames.length === 0) {
      for (const pubkey of $env.DEFAULT_FOLLOWS) {
        petnames.push(mention(pubkey))
      }
    }

    return petnames
  })

  let relays = closure(() => {
    const {relays} = user.get()

    if (relays.length === 0) {
      for (const url of $env.DEFAULT_RELAYS) {
        relays.push({url, read: true, write: true})
      }
    }

    return relays
  })

  const signup = async noteContent => {
    loginWithPrivateKey(privkey)

    // Wait for the published event to go through
    await publishRelays(relays)

    // Re-save preferences now that we have a key and relays. Wait for them
    // to persist so we have the correct user preferences
    await Promise.all([
      publishProfile(profile),
      publishPetnames(petnames),
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
    loadPubkeys($env.DEFAULT_FOLLOWS)
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
