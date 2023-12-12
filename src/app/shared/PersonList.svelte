<script lang="ts">
  import {onMount} from 'svelte'
  import {createScroller} from 'src/util/misc'
  import {getModal} from 'src/partials/state'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"

  export let pubkeys

  let limit = 10

  const loadMore = async () => {
    limit += 10
  }

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
</script>

<FlexColumn>
  {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
    <PersonSummary {pubkey} />
  {/each}
</FlexColumn>
