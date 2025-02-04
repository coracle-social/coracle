<script lang="ts">
  import type {Snippet} from "svelte"
  import {readable} from "svelte/store"
  import {type Instance} from "tippy.js"
  import {identity} from "@welshman/lib"
  import {createSearch} from "@welshman/app"
  import {Suggestions, SuggestionString} from "@welshman/editor"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"

  interface Props {
    value: string
    options: string[]
    before?: Snippet
    allowCreate?: boolean
    class?: string
  }

  let {value, options, before, allowCreate = false, ...restProps}: Props = $props()
  let input: Element | undefined = $state()
  let popover: Instance | undefined = $state()
  let instance: any = $state()

  const search = readable(
    createSearch(options, {
      getValue: identity,
      fuseOptions: {keys: [""]},
    }).searchValues,
  )

  const select = (newValue: string) => {
    popover?.hide()
    value = newValue
  }

  const onKeyDown = (e: Event) => {
    if (instance?.onKeyDown(e)) {
      e.preventDefault()
    }
  }

  const onFocus = () => {
    popover?.show()
  }

  const onBlur = () => {
    popover?.hide()
  }
</script>

<div class={restProps.class}>
  <label class="input input-bordered flex w-full items-center gap-3" bind:this={input}>
    {@render before?.()}
    <input
      class="grow"
      type="text"
      bind:value
      onkeydown={onKeyDown}
      onfocus={onFocus}
      onblur={onBlur} />
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
      getReferenceClientRect: () => input!.getBoundingClientRect(),
    }} />
</div>
