<script lang="ts">
  import {identity} from "ramda"
  import {fly} from "src/util/transition"

  export let select
  export let term = null
  export let create = null
  export let getKey = identity

  let data = []
  let index = 0

  export const setData = d => {
    data = d

    if (!data[index]) {
      index = 0
    }
  }

  export const clear = () => {
    index = 0
    data = []
  }

  export const prev = () => {
    index = Math.max(0, index - 1)
  }

  export const next = () => {
    index = Math.min(create ? data.length : data.length - 1, index + 1)
  }

  export const get = () => {
    return data[index]
  }
</script>

{#if data.length > 0 || (create && term)}
  <div
    class="z-10 mt-2 flex flex-col overflow-hidden rounded border border-solid border-mid"
    in:fly={{y: 20}}>
    {#each data as item, i (getKey(item))}
      <button
        class="cursor-pointer border-l-2 border-solid px-4 py-2 text-left text-lightest hover:border-accent hover:bg-cocoa"
        class:bg-dark={index !== i}
        class:bg-cocoa={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:click|preventDefault={() => select(item)}>
        <slot name="item" {item} />
      </button>
    {/each}
    {#if create && term}
      {@const i = data.length}
      <button
        class="flex cursor-pointer items-center gap-1 border-l-2 border-solid px-4 py-2 text-left text-lightest hover:border-accent hover:bg-cocoa"
        class:bg-dark={index !== i}
        class:bg-cocoa={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:click|preventDefault={() => create(term)}>
        <i class="fa fa-plus" />Add "{term}"
      </button>
    {/if}
  </div>
{/if}
