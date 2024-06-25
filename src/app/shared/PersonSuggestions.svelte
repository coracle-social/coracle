<script lang="ts">
  import {throttle} from 'throttle-debounce'
  import {clamp} from '@welshman/lib'
  import {slide} from "src/util/transition"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {profileSearch} from 'src/engine'

  export let term
  export let select
  export let loading = false

  let element
  let index = 0
  let items = []

  $: populateItems(term)

  const populateItems = throttle(300, term => {
    items = $profileSearch.searchValues(term).slice(0, 30)
  })

  const setIndex = (newIndex, block) => {
    index = clamp([0, items.length - 1], newIndex)
    element.querySelector(`button:nth-child(${index})`)?.scrollIntoView({block})
  }

  export const get = () => items[index]

  export const onKeyDown = e => {
    if (e.code === "ArrowUp") {
      setIndex(index - 1, 'start')

      return true
    }

    if (e.code === "ArrowDown") {
      setIndex(index + 1, 'start')

      return true
    }
  }
</script>

<svelte:options accessors />

{#if items.length > 0}
  <div
    bind:this={element}
    transition:slide|local={{duration: 100}}
    class="mt-2 flex max-h-[350px] flex-col overflow-y-auto overflow-x-hidden border border-solid border-neutral-600">
    {#each items as pubkey, i (pubkey)}
      <button
        class="cursor-pointer border-l-2 border-solid px-4 py-2 text-left text-neutral-100 hover:border-accent hover:bg-tinted-700"
        class:bg-neutral-800={index !== i}
        class:bg-tinted-700={index === i}
        class:border-transparent={index !== i}
        class:border-accent={index === i}
        on:mousedown|preventDefault
        on:click|preventDefault={() => select(pubkey)}>
        <PersonBadge inert {pubkey} />
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
