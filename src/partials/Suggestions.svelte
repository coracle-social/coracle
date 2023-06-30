<script lang="ts">
  import {identity} from "ramda"
  import {fly} from "src/util/transition"

  export let select
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
    index = Math.min(data.length - 1, index + 1)
  }

  export const get = () => {
    return data[index]
  }
</script>

{#if data.length > 0}
  <div class="z-10 mt-2 flex flex-col rounded border border-solid border-gray-6" in:fly={{y: 20}}>
    {#each data as item, i (getKey(item))}
      <button
        class="cursor-pointer border-l-2 border-solid border-black py-2 px-4 text-left text-gray-1 hover:border-accent hover:bg-gray-7"
        class:bg-gray-8={index !== i}
        class:bg-gray-7={index === i}
        class:border-accent={index === i}
        on:click|preventDefault={() => select(item)}>
        <slot name="item" {item} />
      </button>
    {/each}
  </div>
{/if}
