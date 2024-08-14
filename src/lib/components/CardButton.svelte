<script lang="ts">
  import cx from 'classnames'
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  export let icon
  export let title
</script>

<Button on:click class={cx($$props.class, "btn btn-neutral btn-lg text-left h-24")}>
  <div class="flex gap-6 py-4 flex-grow items-center">
    <Icon class="bg-accent" size={7} {icon} />
    <div class="flex flex-col gap-1 flex-grow">
      <p class="text-bold">{title}</p>
      <p class="text-xs"><slot /></p>
    </div>
    <Icon size={7} icon="alt-arrow-right" />
  </div>
</Button>
