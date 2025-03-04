<script lang="ts">
  import {fly} from "svelte/transition"
  import {throttle, clamp} from "@welshman/lib"
  import {preventDefault, stopPropagation} from "@lib/html"

  const {term, search, select, component: Component, allowCreate = false} = $props()

  let index = $state(0)
  let items: string[] = $state([])

  const populateItems = throttle(300, term => {
    items = search(term).slice(0, 5)
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
      } else if ($term && allowCreate) {
        select($term)
        return true
      }
    }

    if (e.code === "Space" && $term && allowCreate) {
      select($term)
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

  const onmousedown = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }

  $effect(() => {
    populateItems($term)
  })
</script>

<div transition:fly|local={{duration: 200}} class="tiptap-suggestions">
  <div class="tiptap-suggestions__content max-h-[40vh]">
    {#if $term && allowCreate && !items.includes($term)}
      <button
        class="tiptap-suggestions__create"
        {onmousedown}
        onclick={stopPropagation(preventDefault(() => select($term)))}>
        Use "<Component value={$term}></Component>"
      </button>
    {/if}
    {#each items as value, i (value)}
      <button
        aria-label={value}
        class="tiptap-suggestions__item"
        class:tiptap-suggestions__selected={index === i}
        {onmousedown}
        onclick={stopPropagation(preventDefault(() => select(value)))}>
        <Component {value}></Component>
      </button>
    {/each}
  </div>
  {#if items.length === 0}
    <div class="tiptap-suggestions__empty">No results</div>
  {/if}
</div>
