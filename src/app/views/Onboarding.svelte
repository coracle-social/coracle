<script lang="ts">
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {closure} from "hurdak"
  import {fly} from "src/util/transition"
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
  import {router} from "src/app/router"

  export let stage = "intro"

  const privkey = generatePrivateKey()
  const profile = {}

  const setStage = s => {
    stage = s
  }

  let petnames = closure(() => {
    if ($session) {
      return []
    }

    const petnames = user.get()?.petnames || []

    if (petnames.length === 0) {
      for (const pubkey of $env.DEFAULT_FOLLOWS) {
        petnames.push(mention(pubkey))
      }
    }

    return petnames
  })

  let relays = closure(() => {
    const relays = user.get()?.relays || []

    if (relays.length === 0) {
      for (const url of $env.DEFAULT_RELAYS) {
        relays.push({url, read: true, write: true})
      }
    }

    return relays
  })

  const signup = async noteContent => {
    loginWithPrivateKey(privkey)

    // Do this first so we know where to publish everything else
    publishRelays(relays)

    // Re-save preferences now that we have a key and relays
    publishProfile(profile)
    publishPetnames(petnames)

    // Publish our welcome note
    if (noteContent) {
      publishNote(noteContent)
    }

    // Start our notifications listener
    listenForNotifications()

    // Close all modals
    router.clearModals()

    // Go to our home page
    router.at("notes").push()
  }

  onMount(() => {
    // Prime our database with some defaults
    loadPubkeys($env.DEFAULT_FOLLOWS)
  })
</script>

{#key stage}
  <div in:fly={{y: 20}}>
    {#if stage === "intro"}
      <OnboardingIntro {setStage} />
    {:else if stage === "profile"}
      <OnboardingProfile {setStage} {profile} />
    {:else if stage === "key"}
      <OnboardingKey {setStage} {privkey} />
    {:else if stage === "relays"}
      <OnboardingRelays {setStage} bind:relays />
    {:else if stage === "follows"}
      <OnboardingFollows {setStage} bind:petnames />
    {:else if stage === "note"}
      <OnboardingNote {setStage} {signup} />
    {/if}
  </div>
{/key}
