<script lang="ts">
  import {identity} from "ramda"
  import {Tags} from "paravel"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import {getParentId} from "src/util/nostr"
  import {getModal} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {
    labels,
    sortEventsDesc,
    load,
    selectHints,
    getPubkeysWithDefaults,
    follows,
    session,
  } from "src/engine"

  export let label
  export let relays = []

  let limit = 5
  let ids = []

  const authors = getPubkeysWithDefaults($follows).concat($session?.pubkey).filter(identity)

  const loadMore = async () => {
    limit += 5
  }

  $: ids = sortEventsDesc($labels.filter(e => Tags.from(e).getValue("l") === label))
    .slice(0, limit)
    .map(e => getParentId(e, "e"))

  onMount(() => {
    const scroller = createScroller(loadMore, {element: getModal()})

    load({
      relays: selectHints(relays),
      filters: [{kinds: [1985], "#l": [label], authors}],
    })

    return () => scroller.stop()
  })
</script>

<Content>
  <Heading><i class="fa fa-tag text-2xl" /> {label}</Heading>
  {#each ids as id, i (id)}
    <div in:fly={{y: 20}}>
      <Note filters={[{authors}]} note={{id}} />
    </div>
  {:else}
    <Spinner />
  {/each}
</Content>
