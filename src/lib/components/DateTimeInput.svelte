<script lang="ts">
  import {DateInput} from "date-picker-svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  interface Props {
    initialValue?: Date | undefined
    value?: Date | undefined
  }

  let {initialValue = undefined, value = $bindable<Date | undefined>(initialValue)}: Props =
    $props()

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

<Button class="relative" onclick={init}>
  <DateInput format="yyyy-MM-dd HH:mm" timePrecision="minute" placeholder="" bind:value />
  <div class="absolute right-2 top-0 flex h-12 cursor-pointer items-center gap-2">
    {#if value}
      <Button onclick={clear} class="h-5">
        <Icon icon="close-circle" />
      </Button>
    {:else}
      <Button class="h-5">
        <Icon icon="calendar-minimalistic" />
      </Button>
    {/if}
  </div>
</Button>
