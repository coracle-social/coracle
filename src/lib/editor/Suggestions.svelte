<svelte:options accessors />

<script lang="ts">
  import {throttle} from "throttle-debounce"
  import {slide} from "svelte/transition"
  import {clamp} from "@welshman/lib"
  import {theme} from "@app/theme"

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
    element.querySelector(`button:nth-child(${index})`)?.scrollIntoView({block})
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

{#if items.length > 0 || (term && allowCreate)}
  <div
    data-theme={$theme}
    bind:this={element}
    transition:slide|local={{duration: 100}}
    class="mt-2 max-h-[350px] overflow-y-auto overflow-x-hidden shadow-xl">
    {#if term && allowCreate}
      <button
        class="white-space-nowrap block w-full min-w-0 cursor-pointer overflow-x-hidden text-ellipsis px-4 py-2 text-left transition-colors hover:bg-primary hover:text-primary-content"
        on:mousedown|preventDefault
        on:click|preventDefault={() => select(term)}>
        Use "<svelte:component this={component} value={term} />"
      </button>
    {/if}
    {#each items as value, i (value)}
      <button
        class="white-space-nowrap block w-full min-w-0 cursor-pointer overflow-x-hidden text-ellipsis px-4 py-2 text-left transition-colors hover:bg-primary hover:text-primary-content"
        class:bg-primary={index === i}
        class:text-primary-content={index === i}
        on:mousedown|preventDefault
        on:click|preventDefault={() => select(value)}>
        <svelte:component this={component} {value} />
      </button>
    {/each}
  </div>
  {#if loading}
    <div transition:slide|local class="bg-tinted-700 flex gap-2 px-4 py-2 text-neutral-200">
      <div>
        <i class="fa fa-circle-notch fa-spin" />
      </div>
      Loading more options...
    </div>
  {/if}
{/if}
