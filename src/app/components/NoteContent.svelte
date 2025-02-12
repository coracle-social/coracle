<script lang="ts">
  import type {ComponentProps} from "svelte"
  import {EVENT_TIME} from "@welshman/util"
  import Content from "@app/components/Content.svelte"
  import CalendarEventDate from "@app/components/CalendarEventDate.svelte"
  import CalendarEventHeader from "@app/components/CalendarEventHeader.svelte"

  const props: ComponentProps<typeof Content> = $props()
</script>

{#if props.event.kind === EVENT_TIME}
  <div class="flex items-start gap-4">
    <CalendarEventDate event={props.event} />
    <div class="flex flex-grow flex-col">
      <div class="flex flex-grow flex-wrap justify-between gap-2">
        <CalendarEventHeader event={props.event} />
      </div>
      <div class="flex py-2 opacity-50">
        <div class="h-px flex-grow bg-base-content opacity-25"></div>
      </div>
      <Content {...props} />
    </div>
  </div>
{:else}
  <Content {...props} />
{/if}
