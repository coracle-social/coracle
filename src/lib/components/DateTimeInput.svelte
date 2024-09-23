<script lang="ts">
  import {DateInput} from "date-picker-svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  export let initialValue: Date | undefined = undefined
  export let value: Date | undefined = initialValue

  const init = () => {
    if (!value) {
      value = new Date()
      value.setMinutes(0, 0, 0)
    }
  }

  const clear = () => {
    value = undefined
  }
</script>

<Button class="relative" on:click={init}>
  <DateInput format="yyyy-MM-dd HH:mm" timePrecision="minute" placeholder="" bind:value />
  <div class="absolute right-2 top-0 flex h-12 cursor-pointer items-center gap-2">
    {#if value}
      <Button on:click={clear} class="h-5">
        <Icon icon="close-circle" />
      </Button>
    {:else}
      <Button class="h-5">
        <Icon icon="calendar-minimalistic" />
      </Button>
    {/if}
  </div>
</Button>
