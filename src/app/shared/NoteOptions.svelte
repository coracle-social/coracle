<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import DateTimeInput from "src/partials/DateTimeInput.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Toggle from "src/partials/Toggle.svelte"

  export let publishAt = false
  export let onClose
  export let onSubmit
  export let initialValues: {
    warning: string
    anonymous: boolean
    publish_at?: number
  }

  const values = {
    ...initialValues,
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
      <FieldInline icon="fa-user-secret" label="Post anonymously">
        <Toggle bind:value={values.anonymous} />
        <p slot="info">Enable this to create an anonymous note.</p>
      </FieldInline>
      <Anchor button tag="button" type="submit">Done</Anchor>
    </FlexColumn>
  </form>
</Modal>
