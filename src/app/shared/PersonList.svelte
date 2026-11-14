<script lang="ts">
  import {onMount} from "svelte"
  import {flatten, partition, sortBy} from "@welshman/lib"
  import {Profiles, Wot, WotScope} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import {createScroller} from "src/util/misc"
  import {profileHasName} from "src/util/nostr"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"

  export let pubkeys: string[]
  export let sortByWot = false

  let element
  let limit = 10

  const profilesByPubkey = fromApp($app => $app.use(Profiles).index.$)
  const wotScores = fromApp($app => $app.use(Wot).scores(WotScope.Follows).$)

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
  // sortBy is stable, so people with a name still come first among equal scores
  $: ordered = sortByWot ? sortBy(pubkey => -($wotScores.get(pubkey) || 0), sorted) : sorted
  $: results = ordered.slice(0, limit)
</script>

<FlexColumn bind:element>
  {#each results as pubkey (pubkey)}
    <Card>
      <PersonSummary {pubkey} />
    </Card>
  {/each}
</FlexColumn>
