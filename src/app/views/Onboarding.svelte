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
  import {Env, pubkeyLoader, Outbox, Builder, User, Keys} from "src/app/engine"
  import {listenForNotifications} from "src/app/state"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}

  if (User.getRelays().length === 0) {
    User.setRelays(Env.DEFAULT_RELAYS.map(url => ({url, read: true, write: true})))
  }

  const signup = async note => {
    const relays = User.getRelays()
    const petnames = User.getPetnames()

    await Keys.login("privkey", privkey)
    await User.setRelays(relays)

    // Re-save preferences now that we have a key
    await Promise.all([
      User.setProfile(profile),
      User.setPetnames(petnames),
      note && Outbox.publish(Builder.createNote(note)),
    ])

    // Start our notifications listener
    listenForNotifications()

    modal.clear()
    navigate("/notes")
  }

  onMount(() => {
    // Prime our database with some defaults
    pubkeyLoader.load(Env.DEFAULT_FOLLOWS)
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
