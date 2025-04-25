<script lang="ts">
  import {chunk, sleep, uniq} from "@welshman/lib"
  import {
    createEvent,
    createProfile,
    PROFILE,
    DELETE,
    isReplaceable,
    getAddress,
    getRelaysFromList,
  } from "@welshman/util"
  import {pubkey, userRelaySelections, publishThunk, repository} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {logout} from "@app/commands"
  import {INDEXER_RELAYS, PLATFORM_NAME, userMembership, getMembershipUrls} from "@app/state"

  let progress: number | undefined = $state(undefined)
  let confirmText = $state("")

  const CONFIRM_TEXT = "permanently delete my nostr account"
  const confirmOk = $derived(confirmText.toLowerCase().trim() === CONFIRM_TEXT)
  const showProgress = $derived(progress !== undefined)

  const deleteProfile = async () => {
    if (!confirmOk) {
      return pushToast({
        theme: "error",
        message: "Please type your confirmation into the text box.",
      })
    }

    const chunks = chunk(500, repository.query([{authors: [$pubkey!]}]))
    const profileEvent = createEvent(PROFILE, createProfile({name: "[deleted]"}))
    const vanishEvent = createEvent(62, {tags: [["relay", "ALL_RELAYS"]]})
    const denominator = chunks.length + 2
    const relays = uniq([
      ...INDEXER_RELAYS,
      ...getRelaysFromList($userRelaySelections),
      ...getMembershipUrls($userMembership),
    ])

    let step = 0

    const incrementProgress = async () => {
      progress = ++step / denominator

      return sleep(800)
    }

    // First, blank out their profile in case relays don't support deletion by address
    await publishThunk({relays, event: profileEvent})

    await incrementProgress()

    // Next, send a "right to vanish" event to all relays
    await publishThunk({relays, event: vanishEvent})

    await incrementProgress()

    // Finally, send deletion requests for all known events in case relays don't support right to vanish
    for (const events of chunks) {
      const tags: string[][] = []

      for (const event of events) {
        tags.push(["e", event.id])

        if (isReplaceable(event)) {
          tags.push(["a", getAddress(event)])
        }
      }

      await publishThunk({relays, event: createEvent(DELETE, {tags})})

      await incrementProgress()
    }

    // Let them see that progress is complete
    await sleep(2000)

    // Goodbye forever!
    await logout()

    window.location.href = "/"
  }

  const confirm = async () => {
    progress = 0

    try {
      await deleteProfile()
    } catch (e) {
      progress = undefined

      throw e
    }
  }

  const back = () => history.back()
</script>

<form class="column gap-4" onsubmit={preventDefault(confirm)}>
  <ModalHeader>
    {#snippet title()}
      Delete your account
    {/snippet}
    {#snippet info()}
      From the Nostr network
    {/snippet}
  </ModalHeader>
  {#if showProgress}
    <p>
      We are currently sending deletion requests to your relay selections and space hosts. Please
      wait while we complete this process. Once we're done, you'll be automatically logged out.
    </p>
    <progress class="progress progress-primary w-full" value={progress! * 100} max="100"></progress>
  {:else}
    <p>
      This will delete your nostr account everywhere, not just on {PLATFORM_NAME}.
    </p>
    <p>
      To confirm, please type "{CONFIRM_TEXT}" into the text box below. This action can't be undone.
    </p>
    <label class="input input-bordered flex w-full items-center gap-2">
      <input bind:value={confirmText} class="grow" type="text" />
    </label>
    <p>
      <strong>Note:</strong> not all relays may honor your request for deletion. If you find that your
      content continues to be available, please contact the offending relays directly.
    </p>
  {/if}
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-error" disabled={showProgress || !confirmOk}>
      <Spinner loading={progress !== undefined}>Confirm</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
