<script lang="ts">
  import {fly} from "svelte/transition"

  export let select

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
  <div class="mt-2 flex flex-col rounded border border-solid border-gray-6" in:fly={{y: 20}}>
    {#each data as item, i}
      <button
        class="cursor-pointer border-l-2 border-solid border-black py-2 px-4 text-white"
        class:bg-gray-8={index !== i}
        class:bg-gray-7={index === i}
        class:border-accent={index === i}
        on:click={() => select(item)}>
        <slot name="item" item={item} />
      </button>
    {/each}
  </div>
{/if}
