<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  interface Props {
    icon?: import("svelte").Snippet
    title?: import("svelte").Snippet
    info?: import("svelte").Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div class="btn btn-neutral flex h-[unset] w-full flex-nowrap py-4 text-left {props.class}">
  <div class="flex flex-grow flex-row items-start gap-1 sm:pl-2">
    <div class="flex h-14 w-12 flex-shrink-0 items-center">
      {@render props.icon?.()}
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-bold text-lg">
        {@render props.title?.()}
      </p>
      <p class="text-sm">
        {@render props.info?.()}
      </p>
    </div>
  </div>
  <div class="hidden h-14 w-14 items-center justify-end sm:flex">
    <Icon size={7} icon="alt-arrow-right" />
  </div>
</div>
