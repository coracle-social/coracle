<script lang="ts">
  import {Capacitor} from "@capacitor/core"
  import {preventDefault} from "@lib/html"
  import {displayRelayUrl, THREAD, MESSAGE, EVENT_TIME, COMMENT} from "@welshman/util"
  import type {Filter} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {getMembershipUrls, getMembershipRoomsByUrl, userMembership} from "@app/state"
  import {loadAlertStatuses} from "@app/requests"
  import {publishAlert} from "@app/commands"
  import {pushToast} from "@app/toast"

  const handler = Capacitor.isNativePlatform()
    ? "https://app.flotilla.social"
    : window.location.origin

  const timezone = new Date()
    .toString()
    .match(/GMT[^\s]+/)![0]
    .slice(3)
  const timezoneOffset = parseInt(timezone) / 100
  const hour = (17 - timezoneOffset) % 24
  const WEEKLY = `0 03 ${hour} * * 1`
  const DAILY = `0 03 ${hour} * * *`

  let loading = false
  let cron = WEEKLY
  let email = ""
  let relay = ""
  let notifyThreads = true
  let notifyCalendar = true
  let notifyChat = false

  const back = () => history.back()

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

    if (notifyThreads) {
      filters.push({kinds: [THREAD]})
      filters.push({kinds: [COMMENT], "#k": [String(THREAD)]})
    }

    if (notifyCalendar) {
      filters.push({kinds: [EVENT_TIME]})
      filters.push({kinds: [COMMENT], "#k": [String(EVENT_TIME)]})
    }

    if (notifyChat) {
      filters.push({kinds: [MESSAGE], "#h": getMembershipRoomsByUrl(relay, $userMembership)})
    }

    loading = true

    try {
      await publishAlert({cron, email, relay, handler, filters})
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
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Confirm</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
