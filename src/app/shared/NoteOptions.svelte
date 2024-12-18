<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
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

  const TZOffset = new Date().getTimezoneOffset() * 60_000

  const values = {
    ...initialValues,
    publish_at:
      initialValues?.publish_at &&
      new Date(initialValues?.publish_at * 1000 - TZOffset).toISOString().slice(0, 16),
  }

  const submit = () =>
    onSubmit({
      ...values,
      publish_at: values.publish_at && Math.floor(new Date(values.publish_at).getTime() / 1000),
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
          <Input
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            bind:value={values.publish_at} />
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
