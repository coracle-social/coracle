<script lang="ts">
  import {onMount} from "svelte"
  import {formatTimestamp} from "@welshman/lib"
  import {Router} from "@welshman/router"
  import {repository} from "@welshman/app"
  import {commaFormat, createScroller} from "src/util/misc"
  import Link from "src/partials/Link.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {router} from "src/app/util/router"
  import {sortEventsDesc} from "src/engine"

  const events = sortEventsDesc(repository.dump())

  const loadMore = async () => {
    limit += 50
  }

  let element
  let limit = 50

  document.title = "Data"

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
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
        Click below to download a backup of all {commaFormat(events.length)}
        events in your database.
      </p>
      <div class="flex justify-center">
        <Link modal class="btn btn-accent" href="/settings/data/export">Create Backup</Link>
      </div>
    </FlexColumn>
  </Card>
  <Card>
    <FlexColumn class="py-6 text-center">
      <h3 class="text-xl sm:h-12">Import Database</h3>
      <p class="sm:h-24">Upload a nostr export file to pull events into your database.</p>
      <div class="flex justify-center">
        <Link modal class="btn btn-accent" href="/settings/data/import">Upload Backup</Link>
      </div>
    </FlexColumn>
  </Card>
</div>

<table bind:this={element}>
  <thead>
    <tr>
      <th />
      <th class="px-2 py-1 text-left">Created</th>
      <th class="px-2 py-1 text-left">Author</th>
      <th class="py-1 pl-2 text-left">Kind</th>
    </tr>
  </thead>
  <tbody>
    {#each events.slice(0, limit) as event}
      <tr>
        <td class="py-1 pr-2">
          <Link
            href={router
              .at("notes")
              .of(event.id, {relays: Router.get().Event(event).getUrls()})
              .toString()}>
            <i class="fa fa-link text-accent" />
          </Link>
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
