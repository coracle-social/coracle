<script>
  import {propEq, identity, uniq, uniqBy, prop, sortBy} from 'ramda'
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {createMap} from 'hurdak/lib/hurdak'
  import {now, createScroller, timedelta} from 'src/util/misc'
  import {findReply, isLike} from 'src/util/nostr'
  import {getPerson, user, db} from 'src/agent'
  import {alerts} from 'src/app'
  import query from 'src/app/query'
  import Spinner from "src/partials/Spinner.svelte"
  import Note from 'src/partials/Note.svelte'
  import Like from 'src/partials/Like.svelte'

  let limit = 0
  let annotatedNotes = []

  onMount(async () => {
    alerts.since.set(now())

    return createScroller(async () => {
      limit += 10

      const events = await db.alerts.toArray()
      const parentIds = uniq(events.map(prop('reply')).filter(identity))
      const parents = await Promise.all(parentIds.map(query.findNote))
      const parentsById = createMap('id', parents.filter(identity))

      const notes = await Promise.all(
        events.filter(propEq('kind', 1)).map(n => query.findNote(n.id))
      )

      const reactions = await Promise.all(
        events
          .filter(e => e.kind === 7 && parentsById[e.reply])
          .map(async e => ({
            ...e,
            person: getPerson(e.pubkey, true),
            parent: parentsById[e.reply],
          }))
      )

      // Combine likes of a single note. Remove grandchild likes
      const likesById = {}
      for (const reaction of reactions.filter(e => e.parent?.pubkey === $user.pubkey)) {
        if (!likesById[reaction.parent.id]) {
          likesById[reaction.parent.id] = {...reaction.parent, people: []}
        }

        likesById[reaction.parent.id].people.push(reaction.person)
      }

      annotatedNotes = sortBy(
        e => -e.created_at,
        notes
          .filter(e => e.pubkey !== $user.pubkey)
          .concat(Object.values(likesById))
      ).slice(0, limit)
    })
  })
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each annotatedNotes as e (e.id)}
  {#if e.people}
  <li in:fly={{y: 20}}><Like note={e} /></li>
  {:else}
  <li in:fly={{y: 20}}><Note note={e} /></li>
  {/if}
  {/each}
</ul>
