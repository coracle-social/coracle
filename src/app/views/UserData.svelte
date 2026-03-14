<script lang="ts">
  import {_} from "svelte-i18n"
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

  document.title = $_("userData.title")

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })
</script>

<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>{$_("userData.heading")}</Heading>
  <p>{$_("userData.description")}</p>
</div>

<div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
  <Card>
    <FlexColumn class="py-6 text-center">
      <h3 class="text-xl sm:h-12">{$_("userData.exportTitle")}</h3>
      <p class="sm:h-24">
        {$_("userData.exportDescription", {values: {count: commaFormat(events.length)}})}
      </p>
      <div class="flex justify-center">
        <Link modal class="btn btn-accent" href="/settings/data/export">{$_("userData.createBackup")}</Link>
      </div>
    </FlexColumn>
  </Card>
  <Card>
    <FlexColumn class="py-6 text-center">
      <h3 class="text-xl sm:h-12">{$_("userData.importTitle")}</h3>
      <p class="sm:h-24">{$_("userData.importDescription")}</p>
      <div class="flex justify-center">
        <Link modal class="btn btn-accent" href="/settings/data/import">{$_("userData.uploadBackup")}</Link>
      </div>
    </FlexColumn>
  </Card>
</div>

<table bind:this={element}>
  <thead>
    <tr>
      <th />
      <th class="px-2 py-1 text-left">{$_("userData.created")}</th>
      <th class="px-2 py-1 text-left">{$_("userData.author")}</th>
      <th class="py-1 pl-2 text-left">{$_("userData.kind")}</th>
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
