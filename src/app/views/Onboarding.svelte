<script lang="ts">
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingKey from "src/app/views/OnboardingKey.svelte"
  import OnboardingRelays from "src/app/views/OnboardingRelays.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {DEFAULT_FOLLOWS, DEFAULT_RELAYS, builder, user} from "src/app/system"
  import {loadAppData, pubkeyLoader} from "src/app/state"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}

  if (user.getRelays().length === 0) {
    user.setRelays(DEFAULT_RELAYS.map(url => ({url, read: true, write: true})))
  }

  const signup = async note => {
    const relays = user.getRelays()
    const petnames = user.getPetnames()

    await user.keys.login("privkey", privkey)

    // Re-save preferences now that we have a key
    await Promise.all([
      user.setRelays(relays),
      user.setProfile(profile),
      user.setPetnames(petnames),
      note && user.publish(builder.createNote(note)),
    ])

    loadAppData(user.getPubkey())

    modal.clear()
    navigate("/notes")
  }

  onMount(() => {
    // Prime our database with some defaults
    pubkeyLoader.loadPubkeys(DEFAULT_FOLLOWS)
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
