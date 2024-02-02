<script lang="ts">
  import {onMount} from "svelte"
  import {flatten, partition} from "ramda"
  import {createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {loadPubkeys, derivePerson, personHasName} from "src/engine"

  export let pubkeys

  let limit = 10

  const loadMore = async () => {
    limit += 10
  }

  const hasName = pubkey => personHasName(derivePerson(pubkey).get())

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element: getModal(),
      threshold: 5000,
      delay: 100,
    })

    return () => {
      scroller.stop()
    }
  })

  $: [withName, withoutName] = partition(hasName, pubkeys)
  $: sorted = flatten([...withName, ...withoutName])
  $: results = sorted.slice(0, limit)
  $: loadPubkeys(results.filter(pubkey => !hasName(pubkey)))
</script>

<FlexColumn>
  {#each results as pubkey (pubkey)}
    <PersonSummary {pubkey} />
  {/each}
</FlexColumn>
