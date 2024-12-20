<svelte:options accessors />

<script lang="ts">
  import {fly} from "svelte/transition"
  import {throttle, clamp} from "@welshman/lib"

  export let term
  export let search
  export let select
  export let component
  export let allowCreate = false

  let index = 0
  let element: Element
  let items: string[] = []

  $: populateItems(term)

  const populateItems = throttle(300, term => {
    items = $search(term).slice(0, 5)
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
  <div bind:this={element} transition:fly|local={{duration: 200}} class="tiptap-suggestions">
    <div class="tiptap-suggestions__content">
      {#if term && allowCreate && !items.includes(term)}
        <button
          class="tiptap-suggestions__create"
          on:mousedown|preventDefault|stopPropagation
          on:click|preventDefault|stopPropagation={() => select(term)}>
          Use "<svelte:component this={component} value={term} />"
        </button>
      {/if}
      {#each items as value, i (value)}
        <button
          class="tiptap-suggestions__item"
          class:tiptap-suggestions__selected={index === i}
          on:mousedown|preventDefault|stopPropagation
          on:click|preventDefault|stopPropagation={() => select(value)}>
          <svelte:component this={component} {value} />
        </button>
      {/each}
    </div>
    {#if items.length === 0}
      <div class="tiptap-suggestions__empty">No results</div>
    {/if}
  </div>
{/if}
