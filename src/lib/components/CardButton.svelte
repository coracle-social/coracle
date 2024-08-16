<script lang="ts">
  import cx from "classnames"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  export let icon
  export let title
</script>

<Button on:click class={cx($$props.class, "btn btn-neutral btn-lg h-24 text-left")}>
  <div class="flex flex-grow items-center gap-6 py-4">
    <Icon class="bg-accent" size={7} {icon} />
    <div class="flex flex-grow flex-col gap-1">
      <p class="text-bold">{title}</p>
      <p class="text-xs"><slot /></p>
    </div>
    <Icon size={7} icon="alt-arrow-right" />
  </div>
</Button>
