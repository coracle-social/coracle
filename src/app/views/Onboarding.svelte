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
  import {
    DEFAULT_FOLLOWS,
    DEFAULT_RELAYS,
    social,
    routing,
    keys,
    directory,
    cmd,
    outbox,
  } from "src/system"
  import network from "src/agent/network"
  import {loadAppData} from "src/app/state"
  import {modal} from "src/partials/state"

  export let stage

  const privkey = generatePrivateKey()
  const profile = {}

  if (routing.getUserRelays().length === 0) {
    routing.setUserRelays(DEFAULT_RELAYS.map(url => ({url, read: true, write: true})))
  }

  const signup = async note => {
    const relays = routing.getUserRelays()
    const urls = routing.getUserRelayUrls()

    await keys.login("privkey", privkey)

    // Re-save preferences now that we have a key
    await Promise.all([
      routing.setUserRelays(relays),
      outbox.publish(cmd.updateUser(profile), urls),
      outbox.publish(note && cmd.createNote(note), urls),
      social.updatePetnames(
        social.getUserFollows().map(pubkey => {
          const hint = routing.getPubkeyHint(pubkey) || ""
          const name = directory.displayPubkey(pubkey)

          return ["p", pubkey, hint, name]
        })
      ),
    ])

    loadAppData(keys.getPubkey())

    modal.clear()
    navigate("/notes")
  }

  onMount(() => {
    // Prime our database with some defaults
    network.loadPeople(DEFAULT_FOLLOWS, {
      relays: routing.getUserHints("read"),
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
