<script lang="ts">
  import {parseJson, nthEq} from "@welshman/lib"
  import {displayFeeds} from "@welshman/feeds"
  import {getAddress, getTagValue, getTagValues} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import AlertDelete from "@app/components/AlertDelete.svelte"
  import type {Alert} from "@app/state"
  import {alertStatuses} from "@app/state"
  import {pushModal} from "@app/modal"

  type Props = {
    alert: Alert
  }

  const {alert}: Props = $props()

  const address = $derived(getAddress(alert.event))
  const status = $derived($alertStatuses.find(s => s.event.tags.some(nthEq(1, address))))
  const cron = $derived(getTagValue("cron", alert.tags))
  const channel = $derived(getTagValue("channel", alert.tags))
  const feeds = $derived(getTagValues("feed", alert.tags))
  const description = $derived(
    getTagValue("description", alert.tags) ||
      [
        `${cron?.endsWith("1") ? "Weekly" : "Daily"} alert for events`,
        displayFeeds(feeds.map(parseJson)),
        `sent via ${channel}.`,
      ].join(" "),
  )

  const startDelete = () => pushModal(AlertDelete, {alert})
</script>

<div class="flex items-start justify-between gap-4">
  <div class="flex items-start gap-4">
    <Button class="py-1" onclick={startDelete}>
      <Icon icon="trash-bin-2" />
    </Button>
    <div class="flex-inline gap-1">{description}</div>
  </div>
  {#if status}
    {@const statusText = getTagValue("status", status.tags) || "error"}
    {#if statusText === "ok"}
      <span
        class="tooltip tooltip-left cursor-pointer rounded-full border border-solid border-base-content px-3 py-1 text-sm"
        data-tip={getTagValue("message", status.tags)}>
        Active
      </span>
    {:else if statusText === "pending"}
      <span
        class="tooltip tooltip-left cursor-pointer rounded-full border border-solid border-base-content border-yellow-500 px-3 py-1 text-sm text-yellow-500"
        data-tip={getTagValue("message", status.tags)}>
        Pending
      </span>
    {:else}
      <span
        class="tooltip tooltip-left cursor-pointer rounded-full border border-solid border-error px-3 py-1 text-sm text-error"
        data-tip={getTagValue("message", status.tags)}>
        {statusText.replace("-", " ").replace(/^(.)/, x => x.toUpperCase())}
      </span>
    {/if}
  {:else}
    <span
      class="tooltip tooltip-left cursor-pointer rounded-full border border-solid border-error px-3 py-1 text-sm text-error"
      data-tip="The notification server did not respond to your request.">
      Inactive
    </span>
  {/if}
</div>
