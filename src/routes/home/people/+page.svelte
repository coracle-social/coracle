<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import {shuffle} from "@welshman/lib"
  import {getPubkeyTagValues, getListTags} from "@welshman/util"
  import {profileSearch, userFollows} from "@welshman/app"
  import PeopleItem from "@app/components/PeopleItem.svelte"

  const defaultPubkeys = shuffle(getPubkeyTagValues(getListTags($userFollows)))

  let term = ""
  let limit = 10
  let element: Element

  $: pubkeys = term ? $profileSearch.searchValues(term) : defaultPubkeys

  onMount(() => {
    const scroller = createScroller({
      element: element.closest(".max-h-screen")!,
      onScroll: () => {
        limit += 10
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="content column gap-4" bind:this={element}>
  <h1 class="superheading mt-20 hidden sm:block">People</h1>
  <p class="hidden text-center sm:block">Get the latest from people in your network</p>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for people..." />
  </label>
  <div class="flex flex-col gap-2">
    {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
      <PeopleItem {pubkey} />
    {/each}
  </div>
</div>
