<script>
  import {sortBy} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {now, formatTimestamp, createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Content from 'src/partials/Content.svelte'
  import Badge from "src/partials/Badge.svelte"
  import Alert from 'src/partials/Alert.svelte'
  import database from 'src/agent/database'
  import alerts from 'src/app/alerts'
  import {modal} from 'src/app/ui'

  let limit = 0
  let notes = null

  onMount(async () => {
    alerts.lastCheckedAlerts.set(now())

    return createScroller(async () => {
      limit += 10

      const events = await database.alerts.all()

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
    {:else if note.likedBy.length > 0}
    <Alert type="likes" {note} />
    {:else}
    <button
      class="py-2 px-3 flex flex-col gap-2 text-white cursor-pointer transition-all w-full
             border border-solid border-black hover:border-medium hover:bg-dark text-left"
      on:click={() => modal.set({type: 'note/detail', note})}>
      <div class="flex gap-2 items-center justify-between relative">
        <div class="flex gap-2 items-center">
          <Badge person={database.getPersonWithFallback(note.pubkey)} />
          <span>mentioned you in their note.</span>
        </div>
        <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
      </div>
      <div class="ml-6 text-light">
        {ellipsize(note.content, 120)}
      </div>
    </button>
    {/if}
  </div>
  {:else}
  <Content size="lg" class="text-center">
    No alerts found - check back later!
  </Content>
  {/each}
</Content>
{:else}
<Spinner />
{/if}
