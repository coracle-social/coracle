<script lang="ts">
  import {commaFormat} from "hurdak"
  import {onDestroy} from "svelte"
  import {createScroller, formatTimestamp} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {router} from "src/app/router"
  import {events, hints, sortEventsDesc} from "src/engine"

  const sortedEvents = events.derived(sortEventsDesc)

  const scroller = createScroller(async () => {
    limit += 50
  })

  let limit = 50

  document.title = "Data"

  onDestroy(() => {
    scroller.stop()
  })
</script>

<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>App Database</Heading>
  <p>View, import, and export your local database.</p>
</div>

<div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
  <Card>
    <FlexColumn class="py-6 text-center">
      <h3 class="text-xl sm:h-12">Export Database</h3>
      <p class="sm:h-24">
        Click below to download a backup of all {commaFormat($events.length)}
        events in your database.
      </p>
      <div class="flex justify-center">
        <Anchor modal button accent href="/settings/data/export">Create Backup</Anchor>
      </div>
    </FlexColumn>
  </Card>
  <Card>
    <FlexColumn class="py-6 text-center">
      <h3 class="text-xl sm:h-12">Import Database</h3>
      <p class="sm:h-24">Upload a nostr export file to pull events into your database.</p>
      <div class="flex justify-center">
        <Anchor modal button accent href="/settings/data/import">Upload Backup</Anchor>
      </div>
    </FlexColumn>
  </Card>
</div>

<table>
  <thead>
    <tr>
      <th />
      <th class="px-2 py-1 text-left">Created</th>
      <th class="px-2 py-1 text-left">Author</th>
      <th class="py-1 pl-2 text-left">Kind</th>
    </tr>
  </thead>
  <tbody>
    {#each $sortedEvents.slice(0, limit) as event}
      <tr>
        <td class="py-1 pr-2">
          <Anchor
            href={router
              .at("notes")
              .of(event.id, {relays: hints.Event(event).limit(3).getUrls()})
              .toString()}>
            <i class="fa fa-link text-accent" />
          </Anchor>
        </td>
        <td class="px-2 py-1">
          {formatTimestamp(event.created_at)}
        </td>
        <td class="px-2 py-1"><PersonBadgeSmall pubkey={event.pubkey} /></td>
        <td class="py-1 pl-2">{event.kind}</td>
      </tr>
    {/each}
  </tbody>
</table>
