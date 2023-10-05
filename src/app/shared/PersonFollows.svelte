<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {derivePerson, loadPubkeys, getFollowedPubkeys} from "src/engine"

  export let pubkey

  let limit = 20

  const pubkeys = derivePerson(pubkey).derived(getFollowedPubkeys)

  const loadMore = async () => {
    limit += 20
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {element: getModal()})

    loadPubkeys($pubkeys)

    return () => {
      scroller.stop()
    }
  })
</script>

<PersonList pubkeys={$pubkeys} />
