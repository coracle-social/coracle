<script lang="ts" context="module">
  export type Values = {
    warning: string
    anonymous: boolean
    pow_difficulty: number
    publish_at?: Date
    expiration?: Date
    relays?: string[]
  }
</script>

<script lang="ts">
  import {relaySearch} from "@welshman/app"
  import {Router} from "@welshman/router"
  import Anchor from "src/partials/Anchor.svelte"
  import DateTimeInput from "src/partials/DateTimeInput.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import WorkEstimate from "src/partials/WorkEstimate.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Toggle from "src/partials/Toggle.svelte"

  export let publishAt = false
  export let onClose
  export let onSubmit
  export let initialValues: Values

  const values = {
    ...initialValues,
  }

  const initRelays = () => {
    values.relays = Router.get().FromUser().getUrls()
  }

  const submit = () =>
    onSubmit({
      ...values,
    })
</script>

<Modal onEscape={onClose}>
  <form on:submit|preventDefault={submit}>
    <FlexColumn>
      <div class="mb-4 flex items-center justify-center">
        <Heading>Note settings</Heading>
      </div>
      <Field icon="fa-warning" label="Content warnings">
        <Input bind:value={values.warning} placeholder="Why might people want to skip this post?" />
      </Field>
      {#if publishAt}
        <Field icon="fa-hourglass-half" label="Schedule post">
          <DateTimeInput bind:value={values.publish_at} />
        </Field>
      {/if}
      <Field>
        <div slot="label" class="flex justify-between">
          <strong>Proof Of Work</strong>
          <div>
            difficulty {values.pow_difficulty} (<WorkEstimate difficulty={values.pow_difficulty} />)
          </div>
        </div>
        <Input type="range" step="1" bind:value={values.pow_difficulty} min={0} max={32}></Input>
        <p slot="info">Add a proof-of-work stamp to your notes to increase your reach.</p>
      </Field>
      <Field icon="fa-wind" label="Expire at">
        <DateTimeInput bind:value={values.expiration} />
      </Field>
      <FieldInline icon="fa-user-secret" label="Post anonymously">
        <Toggle bind:value={values.anonymous} />
        <p slot="info">Enable this to create an anonymous note.</p>
      </FieldInline>
      {#if values.relays}
        <Field icon="fa-server" label="Relays">
          <SearchSelect multiple bind:value={values.relays} search={$relaySearch.searchValues} />
        </Field>
      {:else}
        <FieldInline icon="fa-server" label="Relays">
          <Anchor underline on:click={initRelays}>Select relays</Anchor>
        </FieldInline>
      {/if}
      <Anchor button tag="button" type="submit">Done</Anchor>
    </FlexColumn>
  </form>
</Modal>
