<svelte:options accessors />

<script lang="ts">
  import {throttle} from "throttle-debounce"
  import {slide} from "svelte/transition"
  import {clamp} from "@welshman/lib"

  export let term
  export let search
  export let select
  export let component
  export let loading = false

  let index = 0
  let element: Element
  let items: string[] = []

  $: populateItems(term)

  const populateItems = throttle(300, term => {
    items = $search.searchValues(term).slice(0, 30)
  })

  const setIndex = (newIndex: number, block: ScrollLogicalPosition) => {
    index = clamp([0, items.length - 1], newIndex)
    element.querySelector(`button:nth-child(${index})`)?.scrollIntoView({block})
  }

  export const onKeyDown = (e: any) => {
    if (e.code === "Enter") {
      const value = items[index]

      if (value) {
        select(value)
      }

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

{#if items.length > 0}
  <div
    bind:this={element}
    transition:slide|local={{duration: 100}}
    class="mt-2 flex max-h-[350px] flex-col overflow-y-auto overflow-x-hidden border border-solid border-neutral-600">
    {#each items as value, i (value)}
      <button
        class="cursor-pointer border-l-2 border-solid px-4 py-2 text-left text-neutral-100 hover:border-accent hover:bg-tinted-700"
        class:bg-neutral-800={index !== i}
        class:bg-tinted-700={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:mousedown|preventDefault
        on:click|preventDefault={() => select(value)}>
        <svelte:component this={component} {value} />
      </button>
    {/each}
  </div>
  {#if loading}
    <div transition:slide|local class="flex gap-2 bg-tinted-700 px-4 py-2 text-neutral-200">
      <div>
        <i class="fa fa-circle-notch fa-spin" />
      </div>
      Loading more options...
    </div>
  {/if}
{/if}
