<script lang="ts">
  import type {SvelteComponent} from "svelte"
  import {readable} from 'svelte/store'
  import {type Instance} from "tippy.js"
  import {append, identity, remove, uniq} from "@welshman/lib"
  import {createSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import Suggestions from "@lib/editor/Suggestions.svelte"
  import SuggestionString from "@lib/editor/SuggestionString.svelte"

  export let value: string
  export let options: string[]
  export let allowCreate = false

  let input: Element
  let popover: Instance
  let instance: SvelteComponent

  const search = readable(
    createSearch(options, {
      getValue: identity,
      fuseOptions: {keys: [""]},
    })
  )

  const select = (newValue: string) => {
    popover.hide()
    value = newValue
  }

  const onKeyDown = (e: Event) => {
    if (instance.onKeyDown(e)) {
      e.preventDefault()
    }
  }

  const onFocus = () => {
    popover.show()
  }

  const onBlur = () => {
    popover.hide()
  }
</script>

<div class={$$props.class}>
  <label class="input input-bordered flex w-full items-center gap-3" bind:this={input}>
    <slot name="before" />
    <input class="grow" type="text" bind:value={value} on:keydown={onKeyDown} on:focus={onFocus} on:blur={onBlur} />
    <Icon icon="alt-arrow-down" class="cursor-pointer" />
  </label>
  <Tippy
    bind:popover
    bind:instance
    component={Suggestions}
    props={{
      search,
      select,
      allowCreate,
      term: value,
      component: SuggestionString,
      class: "rounded-box",
      style: `left: 4px; width: ${input?.clientWidth + 12}px`,
    }}
    params={{
      trigger: "manual",
      interactive: true,
      maxWidth: "none",
      getReferenceClientRect: () => input.getBoundingClientRect(),
    }} />
</div>
