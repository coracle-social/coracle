<script lang="ts">
  import Field from '@lib/components/Field.svelte'
  import Icon from '@lib/components/Icon.svelte'

  const back = () => history.back()
</script>

<div class="column gap-4">
  <h1 class="heading">Customize your Space</h1>
  <p class="text-center">
    Give people a few details to go. You can always change this later.
  </p>
  <Field>
    <p slot="label">Give your space a name:</p>
    <input slot="input" type="text" class="input input-bordered w-full max-w-xs" />
  </Field>
  <div class="flex flex-row justify-between items-center gap-4">
    <button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </button>
    <button class="btn btn-primary" on:click={back}>
      Next
      <Icon icon="alt-arrow-right" class="!bg-base-300" />
    </button>
  </div>
</div>
