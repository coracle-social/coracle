<script lang="ts">
  import {without} from "ramda"
  import {createEventDispatcher} from "svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import Heading from "src/partials/Heading.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import {deriveGroupOptions} from "src/engine"

  export let hideFields = []
  export let initialValues: {
    warning: string
    anonymous: boolean
    groups?: string[]
  }

  let values = {groups: [], ...initialValues}
  let view = null

  const dispatch = createEventDispatcher()

  const groupOptions = deriveGroupOptions(initialValues.groups)

  export const setView = name => {
    view = name
    values = {groups: [], ...initialValues}
  }

  const setGroup = address => {
    if (values.groups.includes(address)) {
      values.groups = without([address], values.groups)
    } else {
      values.groups = values.groups.concat(address)
    }
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
        {#if !hideFields.includes("groups") && $groupOptions.length > 0}
          <Field icon="fa-circle-nodes" label="Groups">
            <div class="flex flex-col gap-2">
              {#each $groupOptions as g (g.address)}
                <Card invertColors interactive on:click={() => setGroup(g.address)}>
                  <GroupSummary hideAbout address={g.address}>
                    <div slot="actions">
                      {#if values.groups.includes(g.address)}
                        <i class="fa fa-circle-check text-accent" />
                      {/if}
                    </div>
                  </GroupSummary>
                </Card>
              {/each}
            </div>
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
{/if}
