<script lang="ts">
  import {onMount} from "svelte"
  import {flatten, partition} from "@welshman/lib"
  import {Profiles} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import {createScroller} from "src/util/misc"
  import {profileHasName} from "src/util/nostr"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"

  export let pubkeys

  let element
  let limit = 10

  const profilesByPubkey = fromApp($app => $app.use(Profiles).index.$)

  const loadMore = async () => {
    limit += 10
  }

  const hasName = pubkey => profileHasName($profilesByPubkey.get(pubkey))

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element,
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
</script>

<FlexColumn bind:element>
  {#each results as pubkey (pubkey)}
    <Card>
      <PersonSummary {pubkey} />
    </Card>
  {/each}
</FlexColumn>
