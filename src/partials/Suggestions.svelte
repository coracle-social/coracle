<script lang="ts">
  import {identity} from "ramda"
  import {slide} from "src/util/transition"

  export let select
  export let term = null
  export let create = null
  export let termIsValid = null
  export let loading = false
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
    transition:slide|local={{duration: 100}}
    class="mt-2 flex max-h-[350px] flex-col overflow-y-auto overflow-x-hidden border border-solid border-neutral-600">
    {#if create && term && (!termIsValid || termIsValid(term))}
      {@const i = data.length}
      <button
        class="flex cursor-pointer items-center gap-1 border-l-2 border-solid px-4 py-2 text-left text-neutral-100 hover:border-accent hover:bg-tinted-700"
        class:bg-neutral-800={index !== i}
        class:bg-tinted-700={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:mousedown|preventDefault
        on:click|preventDefault={() => create(term)}>
        <i class="fa fa-plus" />Use "{term}"
      </button>
    {/if}
    {#each data.slice(0, 30) as item, i (getKey(item))}
      <button
        class="cursor-pointer border-l-2 border-solid px-4 py-2 text-left text-neutral-100 hover:border-accent hover:bg-tinted-700"
        class:bg-neutral-800={index !== i}
        class:bg-tinted-700={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:mousedown|preventDefault
        on:click|preventDefault={() => select(item)}>
        <slot name="item" {item} />
      </button>
    {/each}
  </div>
{/if}
{#if loading && data.length > 0}
  <div transition:slide|local class="flex gap-2 bg-tinted-700 px-4 py-2 text-neutral-200">
    <div>
      <i class="fa fa-circle-notch fa-spin" />
    </div>
    Loading more options...
  </div>
{/if}
