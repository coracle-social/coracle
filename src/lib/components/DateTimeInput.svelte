<script lang="ts">
  import cx from 'classnames'
  import {DateInput} from "date-picker-svelte"
  import {formatTimestamp} from '@welshman/app'
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'

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

<label class="relative">
  <DateInput format="yyyy-MM-dd HH:mm" placeholder="" bind:value />
  <div class="absolute top-0 h-12 right-2 flex gap-2 items-center cursor-pointer">
    {#if value}
      <Button on:click={clear} class="h-5">
        <Icon icon="close-circle" />
      </Button>
    {:else}
      <Button on:click={init} class="h-5">
        <Icon icon="calendar-minimalistic" />
      </Button>
    {/if}
  </div>
</label>
