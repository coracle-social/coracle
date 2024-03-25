<script lang="ts">
  import {onMount} from "svelte"
  import {Tags, decodeAddress} from "@coracle.social/util"
  import {sleep} from "hurdak"
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
    loadPubkeys,
    publishNote,
    publishPetnames,
    publishProfile,
    publishRelays,
    getIdFilters,
    loginWithPrivateKey,
    listenForNotifications,
  } from "src/engine"
  import {router} from "src/app/router"

  export let stage = "intro"
  export let invite = false

  const privkey = generatePrivateKey()

  const profile = {}

  const setStage = s => {
    stage = s
  }

  let petnames = $session ? [] : user.get()?.petnames || []

  let relays =
    user.get()?.relays || $env.DEFAULT_RELAYS.map(url => ({url, read: true, write: true}))

  const signup = async noteContent => {
    // Go to our home page
    if (!invite) {
      router.at("notes").push()

      // Make things async since the `key` change in App.svelte prevents the modal
      // animation from completing, and it gets stuck. This is a svelte bug
      await sleep(10)
    }

    loginWithPrivateKey(privkey, {onboarding_tasks_completed: []})

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
  }

  onMount(async () => {
    const {DEFAULT_FOLLOWS, ONBOARDING_LISTS} = $env
    const listOwners = ONBOARDING_LISTS.map(a => decodeAddress(a).pubkey)

    // Prime our database with our default follows and list owners
    loadPubkeys([...DEFAULT_FOLLOWS, ...listOwners])

    // Load our onboarding lists
    load({
      relays: hints.FromPubkeys(listOwners).getUrls(),
      filters: getIdFilters($env.ONBOARDING_LISTS),
      onEvent: e => {
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
      <OnboardingFollows {setStage} bind:petnames bind:relays />
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
