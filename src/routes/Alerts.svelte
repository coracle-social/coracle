<script>
  import {sortBy} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {now, createScroller} from 'src/util/misc'
  import {database} from 'src/agent'
  import {alerts} from 'src/app'
  import Note from 'src/partials/Note.svelte'
  import Content from 'src/partials/Content.svelte'
  import Like from 'src/partials/Like.svelte'

  let limit = 0
  let notes = []

  onMount(async () => {
    alerts.lastCheckedAlerts.set(now())

    return createScroller(async () => {
      limit += 10

      const events = await database.alerts.all()

      notes = sortBy(e => -e.created_at, events).slice(0, limit)
    })
  })
</script>

<Content>
  {#each notes as e (e.id)}
  <div in:fly={{y: 20}}>
    {#if e.likedBy}
    <Like note={e} />
    {:else}
    <Note note={e} />
    {/if}
  </div>
  {:else}
  <Content size="lg" class="text-center">
    No alerts found - check back later!
  </Content>
  {/each}
</Content>
