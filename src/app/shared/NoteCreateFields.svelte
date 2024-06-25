<script lang="ts">
  import {NOTE, EVENT_TIME, CLASSIFIED} from '@welshman/util'
  import Field from 'src/partials/Field.svelte'
  import Input from 'src/partials/Input.svelte'
  import CurrencyInput from 'src/partials/CurrencyInput.svelte'
  import CurrencySymbol from 'src/partials/CurrencySymbol.svelte'
  import DateTimeInput from 'src/partials/DateTimeInput.svelte'

  export let ctrl
</script>

{#if $ctrl.draft.kind !== NOTE}
  <Field label="Title">
    <Input bind:value={$ctrl.draft.extra.title} />
  </Field>
{/if}
{#if $ctrl.draft.kind === CLASSIFIED}
  <Field label="Summary">
    <Input bind:value={$ctrl.draft.extra.summary} />
  </Field>
  <Field label="Price">
    <div class="grid grid-cols-3 gap-2">
      <div class="col-span-2">
        <Input type="number" placeholder="0" bind:value={$ctrl.draft.extra.price}>
          <span slot="before">
            <CurrencySymbol code={$ctrl.draft.extra.currency?.code || "SAT"} />
          </span>
        </Input>
      </div>
      <div class="relative">
        <CurrencyInput bind:value={$ctrl.draft.extra.currency} />
      </div>
    </div>
  </Field>
{/if}
{#if $ctrl.draft.kind === EVENT_TIME}
  <div class="grid grid-cols-2 gap-2">
    <div class="flex flex-col gap-1">
      <strong>Start</strong>
      <DateTimeInput bind:value={$ctrl.draft.extra.start} />
    </div>
    <div class="flex flex-col gap-1">
      <strong>End</strong>
      <DateTimeInput bind:value={$ctrl.draft.extra.end} />
    </div>
  </div>
{/if}
{#if $ctrl.draft.kind !== NOTE}
  <Field label="Location (optional)">
    <Input bind:value={$ctrl.draft.extra.location} />
  </Field>
{/if}
