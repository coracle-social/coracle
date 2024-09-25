<script lang="ts">
  import {randomId} from '@welshman/lib'
  import Icon from '@lib/components/Icon.svelte'

  const id = randomId()

  let input: any
  let label: any

  export const open = () => {
    if (!input.checked) {
      label.click()
    }
  }

  export const close = () => {
    if (input.checked) {
      label.click()
    }
  }

  export const toggle = () => {
    label.click()
  }
</script>

<div class="drawer drawer-end">
  <input {id} type="checkbox" class="drawer-toggle" bind:this={input} />
  <div class="drawer-content">
    <label for={id} bind:this={label} />
  </div>
  <div class="drawer-side z-modal">
    <label for={id} aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="menu bg-base-200 text-base-content min-h-full w-80">
      <slot />
  </div>
  </div>
</div>
