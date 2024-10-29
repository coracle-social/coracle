<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, nth} from "@welshman/lib"
  import {Tags, getAddress, Address, getIdFilters} from "@welshman/util"
  import {session, userRelaySelections, getWriteRelayUrls} from "@welshman/app"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingKeys from "src/app/views/OnboardingKeys.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {
    env,
    load,
    anonymous,
    loadPubkeys,
    requestRelayAccess,
    listenForNotifications,
    broadcastUserData,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let stage = "intro"
  export let invite = null

  let state = {
    pubkey: "",
    username: "",
    profile: {
      name: "",
      about: "",
      picture: "",
    },
    follows: $session ? [] : $anonymous.follows.map(nth(1)),
    relays:
      $anonymous.relays.length === 0
        ? env.DEFAULT_RELAYS.map(url => ["r", url])
        : $anonymous.relays,
    onboardingLists: [],
  }

  if (Array.isArray(invite?.people)) {
    state.follows = [...state.follows, ...invite.people]
  }

  if (invite?.relays) {
    state.relays = [...state.relays, ...invite.relays.map(url => ["r", url])]
  }

  const setStage = s => {
    stage = s
  }

  const signup = async () => {
    if (invite?.groups) {
      router.at("invite").qp({groups: invite.groups}).push()
    } else {
      router.at("notes").push()
    }

    // Immediately request access to any relays with a claim
    for (const {url, claim} of invite?.parsedRelays || []) {
      if (claim) {
        const pub = await requestRelayAccess(url, claim)

        await pub.result
      }
    }

    // Make sure our profile gets to the right relays
    broadcastUserData(getWriteRelayUrls($userRelaySelections))

    // Start our notifications listener
    listenForNotifications()
  }

  onMount(async () => {
    const listOwners = uniq(env.ONBOARDING_LISTS.map(a => Address.from(a).pubkey))

    // Prime our database with our default follows and list owners
    loadPubkeys([...env.DEFAULT_FOLLOWS, ...listOwners])

    // Load our onboarding lists
    load({
      filters: getIdFilters(env.ONBOARDING_LISTS),
      onEvent: e => {
        if (!state.onboardingLists.find(l => getAddress(l) === getAddress(e))) {
          state.onboardingLists = state.onboardingLists.concat(e)
        }

        loadPubkeys(Tags.fromEvent(e).values("p").valueOf())
      },
    })
  })
</script>

<FlexColumn class="mt-8">
  {#key stage}
    {#if stage === "intro"}
      <OnboardingIntro {setStage} />
    {:else if stage === "keys"}
      <OnboardingKeys {setStage} bind:state />
    {:else if stage === "profile"}
      <OnboardingProfile {setStage} bind:state />
    {:else if stage === "follows"}
      <OnboardingFollows {setStage} bind:state />
    {:else if stage === "note"}
      <OnboardingNote {setStage} {signup} />
    {/if}
  {/key}
  <div class="m-auto flex gap-2">
    {#each ["intro", "keys", "profile", "follows", "note"] as s}
      <div
        class="h-2 w-2 rounded-full"
        class:bg-neutral-200={s === stage}
        class:bg-neutral-700={s !== stage} />
    {/each}
  </div>
</FlexColumn>
