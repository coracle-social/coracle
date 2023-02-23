<script>
  import {sortBy, assoc} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {displayPerson} from 'src/util/nostr'
  import {now, formatTimestamp, createScroller} from 'src/util/misc'
  import Spinner from 'src/partials/Spinner.svelte'
  import Content from 'src/partials/Content.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import Alert from 'src/views/alerts/Alert.svelte'
  import database from 'src/agent/database'
  import {lastChecked} from 'src/app/alerts'
  import {modal, routes} from 'src/app/ui'

  let limit = 0
  let notes = null

  onMount(() => {
    lastChecked.update(assoc('alerts', now()))

    return createScroller(async () => {
      limit += 10

      // Filter out alerts for which we failed to find the required context. The bug
      // is really upstream of this, but it's an easy fix
      const events = database.alerts.all()
        .filter(e => e.replies.length > 0 || e.likedBy.length > 0 || e.isMention)

      notes = sortBy(e => -e.created_at, events).slice(0, limit)
    })
  })
</script>

{#if notes}
<Content>
  {#each notes as note (note.id)}
  {@const person = database.getPersonWithFallback(note.pubkey)}
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
      <div class="flex gap-2 items-center justify-between relative w-full">
        <Anchor type="unstyled" href={routes.person(person.pubkey)} class="align-middle">
          <ImageCircle src={person.kind0?.picture} />
          <span class="text-lg font-bold ml-1">{displayPerson(person)}</span>
          <span>mentioned you.</span>
        </Anchor>
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
