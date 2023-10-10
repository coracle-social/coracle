<script lang="ts">
  import cx from "classnames"
  import {fly} from "src/util/transition"

  export let interactive = false
</script>

<div
  on:click|stopPropagation
  in:fly={{y: 20}}
  class={cx(
    $$props.class,
    "card group rounded-2xl border border-solid border-gray-6 bg-gray-7 p-3 text-gray-2",
    "group-[.modal]:border group-[.modal]:border-solid group-[.modal]:border-gray-6 group-[.modal]:bg-gray-8",
    "group-[.card]:border group-[.card]:border-solid group-[.card]:border-gray-6 group-[.card]:bg-gray-8",
    {
      "cursor-pointer transition-all hover:bg-gray-8 group-[.card]:hover:bg-gray-7 group-[.modal]:hover:bg-gray-7":
        interactive,
    }
  )}>
  <slot />
</div>
