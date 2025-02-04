<script lang="ts">
  import {getTag, REPORT} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository} from "@welshman/app"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import {publishDelete} from "@app/commands"

  const {url, event} = $props()

  const reports = deriveEvents(repository, {
    filters: [{kinds: [REPORT], "#e": [event.id]}],
  })

  const back = () => history.back()

  const deleteReport = (report: TrustedEvent) => {
    publishDelete({event: report, relays: [url]})

    if ($reports.length === 0) {
      history.back()
    }
  }

  const getReason = (tags: string[][]) => getTag("e", tags)?.[2] || "other"
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>Report Details</div>
    {/snippet}
    {#snippet info()}
      <div>All reports for this event are shown below.</div>
    {/snippet}
  </ModalHeader>
  {#each $reports as report (report.id)}
    {@const reason = getReason(report.tags)}
    {@const remove = () => deleteReport(report)}
    <div class="column gap-2">
      <div class="flex justify-between">
        <div>
          <Profile pubkey={report.pubkey} />
          <span>Reported this event as "{reason}"</span>
        </div>
        {#if report.pubkey === $pubkey}
          <Button class="btn-default btn" onclick={remove}>Delete Report</Button>
        {/if}
      </div>
      {#if report.content}
        <p>"{report.content}"</p>
      {/if}
    </div>
  {/each}
  <Button class="btn btn-primary" onclick={back}>Got it</Button>
</div>
