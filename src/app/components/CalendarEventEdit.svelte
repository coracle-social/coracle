<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {getTagValue} from "@welshman/util"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import CalendarEventForm from "@app/components/CalendarEventForm.svelte"

  type Props = {
    url: string
    event: TrustedEvent
  }

  const {url, event}: Props = $props()

  const initialValues = {
    d: getTagValue("d", event.tags)!,
    title: getTagValue("title", event.tags)!,
    location: getTagValue("location", event.tags)!,
    start: parseInt(getTagValue("start", event.tags)!),
    end: parseInt(getTagValue("end", event.tags)!),
    content: event.content,
  }
</script>

<CalendarEventForm {url} {initialValues}>
  {#snippet header()}
    <ModalHeader>
      {#snippet title()}
        <div>Edit this Event</div>
      {/snippet}
      {#snippet info()}
        <div>Invite other group members to events online or in real life.</div>
      {/snippet}
    </ModalHeader>
  {/snippet}
</CalendarEventForm>
