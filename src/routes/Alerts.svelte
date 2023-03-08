<script>
  import {sortBy, assoc} from "ramda"
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {now, createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"
  import Alert from "src/views/alerts/Alert.svelte"
  import Mention from "src/views/alerts/Mention.svelte"
  import database from "src/agent/database"
  import user from "src/agent/user"
  import {lastChecked} from "src/app/alerts"

  let limit = 0
  let notes = null

  onMount(() => {
    document.title = "Notifications"

    lastChecked.update(assoc("alerts", now()))

    return createScroller(async () => {
      limit += 10

      // Filter out alerts for which we failed to find the required context. The bug
      // is really upstream of this, but it's an easy fix
      const events = user
        .mute(database.alerts.all())
        .filter(
          e => e.replies.length > 0 || e.likedBy.length > 0 || e.zappedBy?.length > 0 || e.isMention
        )

      notes = sortBy(e => -e.created_at, events).slice(0, limit)
    })
  })
</script>

{#if notes}
  <Content>
    {#each notes as note (note.id)}
      <div in:fly={{y: 20}}>
        {#if note.replies.length > 0}
          <Alert type="replies" {note} />
        {:else if note.zappedBy?.length > 0}
          <Alert type="zaps" {note} />
        {:else if note.likedBy.length > 0}
          <Alert type="likes" {note} />
        {:else}
          <Mention {note} />
        {/if}
      </div>
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  </Content>
{:else}
  <Spinner />
{/if}
