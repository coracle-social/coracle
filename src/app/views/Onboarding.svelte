<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, nth} from "@welshman/lib"
  import {
    getPubkeyTagValues,
    RelayMode,
    getAddress,
    Address,
    getIdFilters,
    getRelaysFromList,
  } from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {session, userRelaySelections, thunkIsComplete} from "@welshman/app"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingKeys from "src/app/views/OnboardingKeys.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {
    env,
    myRequest,
    anonymous,
    loadPubkeys,
    requestRelayAccess,
    listenForNotifications,
    broadcastUserData,
  } from "src/engine"
  import {router} from "src/app/util/router"
  import {setChecked} from "src/engine"

  export let invite = null
  export let stage = "intro"
  export let nstartCompleted = false

  let state = {
    pubkey: "",
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
    router.at("notes").push()

    // Immediately request access to any relays with a claim
    for (const {url, claim} of invite?.parsedRelays || []) {
      if (claim) {
        const thunk = await requestRelayAccess(url, claim)

        await new Promise<void>(resolve => {
          thunk.subscribe(t => {
            if (thunkIsComplete(t)) {
              resolve()
            }
          })
        })
      }
    }

    // Make sure our profile gets to the right relays
    broadcastUserData(getRelaysFromList($userRelaySelections, RelayMode.Write))

    // Start our notifications listener
    listenForNotifications()
    setChecked("*")
  }

  onMount(async () => {
    const listOwners = uniq(env.ONBOARDING_LISTS.map(a => Address.from(a).pubkey))

    // Prime our database with our default follows and list owners
    loadPubkeys([...env.DEFAULT_FOLLOWS, ...listOwners])

    // Load our onboarding lists
    myRequest({
      autoClose: true,
      filters: getIdFilters(env.ONBOARDING_LISTS),
      relays: Router.get().FromPubkeys(listOwners).policy(addMaximalFallbacks).getUrls(),
      onEvent: e => {
        if (!state.onboardingLists.find(l => getAddress(l) === getAddress(e))) {
          state.onboardingLists = state.onboardingLists.concat(e)
        }

        loadPubkeys(getPubkeyTagValues(e.tags))
      },
    })
  })
</script>

<FlexColumn class="mt-8">
  {#key stage}
    {#if stage === "intro"}
      <OnboardingIntro {setStage} />
    {:else if stage === "keys"}
      <OnboardingKeys {setStage} {nstartCompleted} />
    {:else if stage === "follows"}
      <OnboardingFollows {setStage} bind:state />
    {:else if stage === "note"}
      <OnboardingNote {setStage} {signup} {state} />
    {/if}
  {/key}
  <div class="m-auto flex gap-2">
    {#each ["intro", "keys", "follows", "note"] as s}
      <div
        class="h-2 w-2 rounded-full"
        class:bg-neutral-300={s === stage}
        class:bg-neutral-500={s !== stage} />
    {/each}
  </div>
</FlexColumn>
