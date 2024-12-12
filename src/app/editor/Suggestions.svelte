<svelte:options accessors />

<script lang="ts">
  import {fly, slide} from "svelte/transition"
  import {throttle, clamp} from "@welshman/lib"
  import {theme} from "src/partials/state"

  export let term
  export let search
  export let select
  export let component
  export let loading = false
  export let allowCreate = false

  let index = 0
  let element: Element
  let items: string[] = []

  $: populateItems(term)

  const populateItems = throttle(300, term => {
    items = $search.searchValues(term).slice(0, 5)
  })

  const setIndex = (newIndex: number, block: any) => {
    index = clamp([0, items.length - 1], newIndex)
  }

  export const onKeyDown = (e: any) => {
    if (["Enter", "Tab"].includes(e.code)) {
      const value = items[index]

      if (value) {
        select(value)
        return true
      } else if (term && allowCreate) {
        select(term)
        return true
      }
    }

    if (e.code === "Space" && term && allowCreate) {
      select(term)
      return true
    }

    if (e.code === "ArrowUp") {
      setIndex(index - 1, "start")

      return true
    }

    if (e.code === "ArrowDown") {
      setIndex(index + 1, "start")

      return true
    }
  }
</script>

{#if term}
  <div
    data-theme={$theme}
    bind:this={element}
    transition:fly|local={{duration: 200}}
    class="mt-2 max-h-[350px] overflow-y-auto overflow-x-hidden shadow-xl {$$props.class} bg-alt"
    style={$$props.style}>
    {#if term && allowCreate && !items.includes(term)}
      <button
        class="white-space-nowrap block w-full min-w-0 cursor-pointer overflow-x-hidden text-ellipsis px-4 py-2 text-left transition-all hover:brightness-150"
        on:mousedown|preventDefault|stopPropagation
        on:click|preventDefault|stopPropagation={() => select(term)}>
        Use "<svelte:component this={component} value={term} />"
      </button>
    {/if}
    {#each items as value, i (value)}
      <button
        class="white-space-nowrap flex w-full min-w-0 cursor-pointer items-center overflow-x-hidden text-ellipsis px-4 py-2 text-left transition-all hover:brightness-150"
        class:brightness-150={index === i}
        class:dark:bg-neutral-700-d={index === i}
        class:bg-neutral-400-d={index === i}
        on:mousedown|preventDefault|stopPropagation
        on:click|preventDefault|stopPropagation={() => select(value)}>
        <svelte:component this={component} {value} />
      </button>
    {/each}
  </div>
  {#if loading}
    <div transition:slide|local class="flex gap-2 px-4 py-2">
      <div>
        <i class="fa fa-circle-notch fa-spin" />
      </div>
      Loading more options...
    </div>
  {/if}
  {#if !items.length && !loading}
    <div class="flex gap-2 px-4 py-2 text-base">
      <div>
        <i class="fa fa-exclamation-circle" />
      </div>
      No results
    </div>
  {/if}
{/if}
