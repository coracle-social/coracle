<script lang="ts">
  import {nip19} from "nostr-tools"
  import {commaFormat} from "hurdak"
  import {onDestroy} from "svelte"
  import {createScroller, formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {events, getEventHints, sortEventsDesc} from "src/engine"

  const sortedEvents = events.derived(sortEventsDesc)

  const scroller = createScroller(async () => {
    limit += 50
  })

  const startExport = () => modal.push({type: "data/export"})

  const startImport = () => modal.push({type: "data/import"})

  let limit = 50

  document.title = "Data"

  onDestroy(() => {
    scroller.stop()
  })
</script>

<Content>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>App Database</Heading>
    <p>View, import, and export your local database.</p>
  </div>
  <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
    <Card>
      <Content>
        <h3 class="text-center text-xl sm:h-12">Export Database</h3>
        <p class="sm:h-24">
          Click below to download a backup of all {commaFormat($events.length)}
          events in your database.
        </p>
        <div class="flex justify-center">
          <Anchor theme="button-accent" on:click={startExport}>Create Backup</Anchor>
        </div>
      </Content>
    </Card>
    <Card>
      <Content>
        <h3 class="text-center text-xl sm:h-12">Import Database</h3>
        <p class="sm:h-24">Upload a nostr export file to pull events into your database.</p>
        <div class="flex justify-center">
          <Anchor theme="button-accent" on:click={startImport}>Upload Backup</Anchor>
        </div>
      </Content>
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
        {@const nevent = nip19.neventEncode({id: event.id, relays: getEventHints(event)})}
        <tr>
          <td class="py-1 pr-2">
            <Anchor href={"/" + nevent}>
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
</Content>
