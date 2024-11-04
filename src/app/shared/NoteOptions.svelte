<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import {createEventDispatcher} from "svelte"

  export let initialValues: {
    warning: string
    anonymous: boolean
  }

  let values = {groups: [], ...initialValues}
  let view = null

  const dispatch = createEventDispatcher()

  export const setView = name => {
    view = name
    values = {groups: [], ...initialValues}
  }

  const onSubmit = () => {
    initialValues = values
    dispatch("change", values)
    setView(null)
  }
</script>

{#if view}
  <Modal onEscape={() => setView(null)}>
    <form on:submit|preventDefault={onSubmit}>
      <FlexColumn>
        <div class="mb-4 flex items-center justify-center">
          <Heading>Note settings</Heading>
        </div>
        <Field icon="fa-warning" label="Content warnings">
          <Input
            bind:value={values.warning}
            placeholder="Why might people want to skip this post?" />
        </Field>
        <FieldInline icon="fa-user-secret" label="Post anonymously">
          <Toggle bind:value={values.anonymous} />
          <p slot="info">Enable this to create an anonymous note.</p>
        </FieldInline>
        <Anchor button tag="button" type="submit">Done</Anchor>
      </FlexColumn>
    </form>
  </Modal>
{/if}
