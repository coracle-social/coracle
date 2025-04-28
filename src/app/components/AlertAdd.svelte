<script lang="ts">
  import {preventDefault} from "@lib/html"
  import {randomInt, displayList, TIMEZONE, identity} from "@welshman/lib"
  import {displayRelayUrl, getTagValue, THREAD, MESSAGE, EVENT_TIME, COMMENT} from "@welshman/util"
  import type {Filter} from "@welshman/util"
  import type {Nip46ResponseWithResult} from "@welshman/signer"
  import {makeIntersectionFeed, makeRelayFeed, feedFromFilters} from "@welshman/feeds"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoBunker from "@app/components/InfoBunker.svelte"
  import BunkerConnect, {BunkerConnectController} from "@app/components/BunkerConnect.svelte"
  import {
    GENERAL,
    alerts,
    getMembershipUrls,
    getMembershipRoomsByUrl,
    userMembership,
  } from "@app/state"
  import {loadAlertStatuses} from "@app/requests"
  import {publishAlert} from "@app/commands"
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"

  const timezoneOffset = parseInt(TIMEZONE.slice(3)) / 100
  const minute = randomInt(0, 59)
  const hour = (17 - timezoneOffset) % 24
  const WEEKLY = `0 ${minute} ${hour} * * 1`
  const DAILY = `0 ${minute} ${hour} * * *`

  let loading = false
  let cron = WEEKLY
  let email = $alerts.map(a => getTagValue("email", a.tags)).filter(identity)[0] || ""
  let relay = ""
  let bunker = ""
  let secret = ""
  let notifyThreads = true
  let notifyCalendar = true
  let notifyChat = false
  let showBunker = false

  const back = () => history.back()

  const controller = new BunkerConnectController({
    onNostrConnect: (response: Nip46ResponseWithResult) => {
      bunker = controller.broker.getBunkerUrl()
      secret = controller.broker.params.clientSecret
      showBunker = false
    },
  })

  const connectBunker = () => {
    showBunker = true
  }

  const hideBunker = () => {
    showBunker = false
  }

  const clearBunker = () => {
    bunker = ""
    secret = ""
  }

  const submit = async () => {
    if (!email.includes("@")) {
      return pushToast({
        theme: "error",
        message: "Please provide an email address",
      })
    }

    if (!relay) {
      return pushToast({
        theme: "error",
        message: "Please select a space",
      })
    }

    if (!notifyThreads && !notifyCalendar && !notifyChat) {
      return pushToast({
        theme: "error",
        message: "Please select something to be notified about",
      })
    }

    const filters: Filter[] = []
    const display: string[] = []

    if (notifyThreads) {
      display.push("threads")
      filters.push({kinds: [THREAD]})
      filters.push({kinds: [COMMENT], "#k": [String(THREAD)]})
    }

    if (notifyCalendar) {
      display.push("calendar events")
      filters.push({kinds: [EVENT_TIME]})
      filters.push({kinds: [COMMENT], "#k": [String(EVENT_TIME)]})
    }

    if (notifyChat) {
      display.push("chat")
      filters.push({
        kinds: [MESSAGE],
        "#h": [GENERAL, ...getMembershipRoomsByUrl(relay, $userMembership)],
      })
    }

    loading = true

    try {
      const cadence = cron?.endsWith("1") ? "Weekly" : "Daily"
      const description = `${cadence} alert for ${displayList(display)} on ${displayRelayUrl(relay)}, sent via email.`
      const feed = makeIntersectionFeed(feedFromFilters(filters), makeRelayFeed(relay))
      const thunk = await publishAlert({cron, email, feed, bunker, secret, description})

      await thunk.result
      await loadAlertStatuses($pubkey!)

      pushToast({message: "Your alert has been successfully created!"})
      back()
    } finally {
      loading = false
    }
  }
</script>

<form class="column gap-4" onsubmit={preventDefault(submit)}>
  <ModalHeader>
    {#snippet title()}
      Add an Alert
    {/snippet}
  </ModalHeader>
  {#if showBunker}
    <div class="card2 flex flex-col items-center gap-4 bg-base-300">
      <p>Scan using a nostr signer, or click to copy.</p>
      <BunkerConnect {controller} />
      <Button class="btn btn-neutral btn-sm" onclick={hideBunker}>Cancel</Button>
    </div>
  {:else}
    <FieldInline>
      {#snippet label()}
        <p>Email Address*</p>
      {/snippet}
      {#snippet input()}
        <label class="input input-bordered flex w-full items-center gap-2">
          <input placeholder="email@example.com" bind:value={email} />
        </label>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Frequency*</p>
      {/snippet}
      {#snippet input()}
        <select bind:value={cron} class="select select-bordered">
          <option value={WEEKLY}>Weekly</option>
          <option value={DAILY}>Daily</option>
        </select>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Space*</p>
      {/snippet}
      {#snippet input()}
        <select bind:value={relay} class="select select-bordered">
          <option value="" disabled selected>Choose a space URL</option>
          {#each getMembershipUrls($userMembership) as url (url)}
            <option value={url}>{displayRelayUrl(url)}</option>
          {/each}
        </select>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Notifications*</p>
      {/snippet}
      {#snippet input()}
        <div class="flex items-center justify-end gap-4">
          <span class="flex gap-3">
            <input type="checkbox" class="checkbox" bind:checked={notifyThreads} />
            Threads
          </span>
          <span class="flex gap-3">
            <input type="checkbox" class="checkbox" bind:checked={notifyCalendar} />
            Calendar
          </span>
          <span class="flex gap-3">
            <input type="checkbox" class="checkbox" bind:checked={notifyChat} />
            Chat
          </span>
        </div>
      {/snippet}
    </FieldInline>
    <div class="card2 flex flex-col gap-3 bg-base-300">
      <div class="flex items-center justify-between">
        <strong>Connect a Bunker</strong>
        <span class="flex items-center gap-2 text-sm" class:text-primary={bunker}>
          {#if bunker}
            <Icon icon="check-circle" size={5} />
            Connected
          {:else}
            <Icon icon="close-circle" size={5} />
            Not Connected
          {/if}
        </span>
      </div>
      <p class="text-sm">
        Required for receiving alerts about spaces with access controls. You can get one from your
        <Button class="text-primary" onclick={() => pushModal(InfoBunker)}>remote signer app</Button
        >.
      </p>
      {#if bunker}
        <Button class="btn btn-neutral btn-sm flex-grow" onclick={clearBunker}>Disconnect</Button>
      {:else}
        <Button class="btn btn-primary btn-sm w-full flex-grow" onclick={connectBunker}
          >Connect</Button>
      {/if}
    </div>
  {/if}
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading || showBunker}>
      <Spinner {loading}>Confirm</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
