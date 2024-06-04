<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, concat, nth} from "@welshman/lib"
  import {FOLLOWS, Tags, getAddress, Address, getIdFilters} from "@welshman/util"
  import {generatePrivateKey} from "src/util/nostr"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import OnboardingIntro from "src/app/views/OnboardingIntro.svelte"
  import OnboardingProfile from "src/app/views/OnboardingProfile.svelte"
  import OnboardingFollows from "src/app/views/OnboardingFollows.svelte"
  import OnboardingNote from "src/app/views/OnboardingNote.svelte"
  import {
    env,
    load,
    user,
    hints,
    session,
    mention,
    loadPubkeys,
    publishNote,
    updateSingleton,
    publishProfile,
    publishRelays,
    urlToRelayPolicy,
    userRelayPolicies,
    tagsFromContent,
    requestRelayAccess,
    loginWithPrivateKey,
    listenForNotifications,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let stage = "intro"
  export let invite = null

  const privkey = generatePrivateKey()

  const profile = {}

  const setStage = s => {
    stage = s
  }

  let onboardingLists = []

  let follows = $session ? [] : user.get()?.petnames?.map(nth(1)) || []

  if (invite?.people) {
    follows = concat(follows, invite.people)
  }

  let relays = $userRelayPolicies || $env.DEFAULT_RELAYS.map(urlToRelayPolicy)

  if (invite?.relays) {
    relays = concat(relays, invite.relays.map(urlToRelayPolicy))
  }

  const signup = async noteContent => {
    loginWithPrivateKey(privkey, {onboarding_tasks_completed: []})

    if (invite?.groups) {
      router.at("invite").qp({groups: invite.groups}).push()
    } else {
      router.at("notes").push()
    }

    // Immediately request access to any relays with a claim so that when we save our
    // profile information it doesn't get rejected
    for (const {url, claim} of invite?.parsedRelays || []) {
      if (claim) {
        const pub = await requestRelayAccess(url, claim, privkey)

        await pub.result
      }
    }

    // Do this first so we know where to publish everything else
    publishRelays(relays)

    // Re-save preferences now that we have a key and relays
    publishProfile(profile)
    updateSingleton(FOLLOWS, {add: follows.map(mention)})

    // Publish our welcome note
    if (noteContent) {
      publishNote(noteContent, tagsFromContent(noteContent))
    }

    // Start our notifications listener
    listenForNotifications()
  }

  onMount(async () => {
    const {DEFAULT_FOLLOWS, ONBOARDING_LISTS} = $env
    const listOwners = uniq(ONBOARDING_LISTS.map(a => Address.from(a).pubkey))

    // Prime our database with our default follows and list owners
    loadPubkeys([...DEFAULT_FOLLOWS, ...listOwners])

    // Load our onboarding lists
    load({
      relays: hints.FromPubkeys(listOwners).redundancy(5).getUrls(),
      filters: getIdFilters($env.ONBOARDING_LISTS),
      onEvent: e => {
        if (!onboardingLists.find(l => getAddress(l) === getAddress(e))) {
          onboardingLists = onboardingLists.concat(e)
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
    {:else if stage === "profile"}
      <OnboardingProfile {setStage} {profile} />
    {:else if stage === "follows"}
      <OnboardingFollows {setStage} {onboardingLists} bind:follows bind:relays />
    {:else if stage === "note"}
      <OnboardingNote {setStage} {signup} />
    {/if}
  {/key}
  <div class="m-auto flex gap-2">
    <div
      class="h-2 w-2 rounded-full"
      class:bg-neutral-200={stage === "intro"}
      class:bg-neutral-700={stage !== "intro"} />
    <div
      class="h-2 w-2 rounded-full"
      class:bg-neutral-200={stage === "profile"}
      class:bg-neutral-700={stage !== "profile"} />
    <div
      class="h-2 w-2 rounded-full"
      class:bg-neutral-200={stage === "follows"}
      class:bg-neutral-700={stage !== "follows"} />
    <div
      class="h-2 w-2 rounded-full"
      class:bg-neutral-200={stage === "note"}
      class:bg-neutral-700={stage !== "note"} />
  </div>
</FlexColumn>
