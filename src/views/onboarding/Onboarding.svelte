<script lang="ts">
  import {uniq} from "ramda"
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {fly} from "svelte/transition"
  import {navigate} from "svelte-routing"
  import {shuffle} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import OnboardingIntro from "src/views/onboarding/OnboardingIntro.svelte"
  import OnboardingKey from "src/views/onboarding/OnboardingKey.svelte"
  import OnboardingRelays from "src/views/onboarding/OnboardingRelays.svelte"
  import OnboardingFollows from "src/views/onboarding/OnboardingFollows.svelte"
  import OnboardingComplete from "src/views/onboarding/OnboardingComplete.svelte"
  import {getFollows} from "src/agent/social"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/tables"
  import network from "src/agent/network"
  import user from "src/agent/user"
  import keys from "src/agent/keys"
  import {loadAppData} from "src/app"
  import {modal} from "src/app/ui"

  export let stage

  let relays = [
    {url: "wss://nostr-pub.wellorder.net", write: true},
    {url: "wss://nostr.zebedee.cloud", write: true},
    {url: "wss://nos.lol", write: true},
    {url: "wss://brb.io", write: true},
  ]

  let follows = [
    "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322", // hodlbod
    "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d", // fiatjaf
    "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2", // jack
    "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93", // Gigi
  ]

  const privkey = generatePrivateKey()

  const signup = async () => {
    await keys.login("privkey", privkey)
    await user.updateRelays(() => relays)
    await user.updatePetnames(() =>
      follows.map(pubkey => {
        const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))
        const name = displayPerson(getPersonWithFallback(pubkey))

        return ["p", pubkey, url, name]
      })
    )

    loadAppData(user.getPubkey())

    modal.set(null)
    navigate("/notes/follows")
  }

  // Prime our people cache for hardcoded follows and a sample of people they follow
  onMount(async () => {
    await network.loadPeople(follows, {relays})

    const others = shuffle(uniq(follows.flatMap(getFollows))).slice(0, 256)

    await network.loadPeople(others, {relays})
  })
</script>

{#key stage}
  <div in:fly={{y: 20}}>
    {#if stage === "intro"}
      <OnboardingIntro />
    {:else if stage === "key"}
      <OnboardingKey {privkey} />
    {:else if stage === "relays"}
      <OnboardingRelays bind:relays />
    {:else if stage === "follows"}
      <OnboardingFollows bind:follows />
    {:else}
      <OnboardingComplete {signup} />
    {/if}
  </div>
{/key}
