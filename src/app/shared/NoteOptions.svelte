<script lang="ts">
  import {without, uniq} from "ramda"
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
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import {env, hints, session, deriveGroupOptions, displayRelay} from "src/engine"

  export let hideFields = []
  export let initialValues: {
    warning: string
    anonymous: boolean
    groups?: string[]
    relays?: string[]
  }

  let values = {groups: [], relays: [], ...initialValues}
  let view = null
  let relaySearch = ""
  let relaysDirty = false

  const dispatch = createEventDispatcher()

  const groupOptions = deriveGroupOptions(initialValues.groups)

  export const setView = name => {
    view = name
    relaySearch = ""
    values = {groups: [], relays: [], ...initialValues}
  }

  const addRelay = url => {
    relaySearch = ""

    values.relays = values.relays.concat(url)
    relaysDirty = true
  }

  const removeRelay = url => {
    values.relays = without([url], values.relays)
    relaysDirty = true
  }

  const setGroup = address => {
    if (values.groups.includes(address)) {
      values.groups = without([address], values.groups)
    } else {
      values.groups = values.groups.concat(address)
    }

    if (!relaysDirty) {
      values.relays = hints.PrePublishEvent($session.pubkey, [], values.groups).getUrls()
      console.log(values.relays)
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
        {#if !hideFields.includes("relays") && $env.FORCE_RELAYS.length === 0}
          <Field icon="fa-database" label="Select which relays to publish to">
            <div>
              {#each values.relays as url}
                <div
                  class="mb-2 mr-1 inline-block rounded-full border border-solid border-neutral-100 px-2 py-1">
                  <button
                    type="button"
                    class="fa fa-times cursor-pointer"
                    on:click={() => removeRelay(url)} />
                  {displayRelay({url})}
                </div>
              {/each}
            </div>
            <RelaySearch bind:q={relaySearch} limit={3} hideIfEmpty>
              <div slot="item" let:relay>
                <RelayCard {relay}>
                  <button
                    slot="actions"
                    class="underline"
                    on:click|preventDefault={() => addRelay(relay.url)}>
                    Add relay
                  </button>
                </RelayCard>
              </div>
            </RelaySearch>
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
