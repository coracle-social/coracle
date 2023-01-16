<script>
  import {sortBy} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {now, createScroller} from 'src/util/misc'
  import {isLike} from 'src/util/nostr'
  import {user, db} from 'src/agent'
  import {alerts} from 'src/app'
  import Note from 'src/partials/Note.svelte'
  import Content from 'src/partials/Content.svelte'
  import Like from 'src/partials/Like.svelte'

  let limit = 0
  let annotatedNotes = []

  onMount(async () => {
    alerts.lastCheckedAlerts.set(now())

    return createScroller(async () => {
      limit += 10

      const events = await db.alerts.toArray()
      const notes = events.filter(e => e.kind === 1)
      const likes = events.filter(e => e.kind === 7 && isLike(e.content))

      // Combine likes of a single note. Remove grandchild likes
      const likesById = {}
      for (const like of likes.filter(e => e.parent?.pubkey === $user.pubkey)) {
        if (!likesById[like.parent.id]) {
          likesById[like.parent.id] = {...like.parent, people: []}
        }

        likesById[like.parent.id].people.push(like.person)
      }

      annotatedNotes = sortBy(
        e => -e.created_at,
        notes
          .filter(e => e && e.pubkey !== $user.pubkey)
          .concat(Object.values(likesById))
      ).slice(0, limit)
    })
  })
</script>

<Content>
  {#each annotatedNotes as e (e.id)}
  <div in:fly={{y: 20}}>
    {#if e.people}
    <Like note={e} />
    {:else}
    <Note note={e} />
    {/if}
  </div>
  {/each}
</Content>
