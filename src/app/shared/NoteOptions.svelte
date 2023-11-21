<script lang="ts">
  import {without} from "ramda"
  import {createEventDispatcher} from "svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import Heading from "src/partials/Heading.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import GroupSummary from "src/app/shared/GroupSummary.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import {mergeHints, displayRelay, getGroupRelayUrls} from "src/engine"
  import {
    env,
    deriveGroupAccess,
    GroupAccess,
    MembershipLevel,
    getUserRelayUrls,
    deriveMembershipLevel,
  } from "src/engine"

  export let groupOptions = []
  export let showRelays = $env.FORCE_RELAYS.length === 0
  export let initialValues: {
    warning: string
    groups: string[]
    relays: string[]
    anonymous: boolean
    shouldWrap: boolean
  }

  let values = {...initialValues}
  let view = null
  let relaySearch = ""
  let relaysDirty = false
  let canPostPrivately = false
  let canPostPublicly = false

  const dispatch = createEventDispatcher()

  export const setView = name => {
    view = name

    if (!view) {
      relaySearch = ""
      values = {...initialValues}
    }
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
    // Reset this, it'll get reset reactively below
    values.shouldWrap = true

    if (values.groups.includes(address)) {
      values.groups = without([address], values.groups)
    } else {
      values.groups = values.groups.concat(address)
    }

    if (!relaysDirty) {
      if (values.groups.length > 0) {
        values.relays = mergeHints(values.groups.map(getGroupRelayUrls))
      } else {
        values.relays = getUserRelayUrls("write")
      }
    }
  }

  const onSubmit = () => {
    initialValues = values
    dispatch("change", values)
    setView(null)
  }

  $: {
    canPostPrivately = false
    canPostPublicly = true

    for (const address of values.groups) {
      const access = deriveGroupAccess(address).get()
      const membershipLevel = deriveMembershipLevel(address).get()

      if (access !== GroupAccess.Closed) {
        canPostPublicly = true
      }

      if (membershipLevel === MembershipLevel.Private) {
        canPostPrivately = true
      }
    }

    values.shouldWrap = values.shouldWrap && canPostPrivately

    dispatch("change", {shouldWrap: values.shouldWrap})
  }
</script>

{#if view}
  <Modal onEscape={() => setView(null)}>
    <form on:submit|preventDefault={onSubmit}>
      <Content>
        {#if view === "settings"}
          <div class="mb-4 flex items-center justify-center">
            <Heading>Note settings</Heading>
          </div>
          <Field icon="fa-warning" label="Content warnings">
            <Input
              bind:value={values.warning}
              placeholder="Why might people want to skip this post?" />
          </Field>
          {#if showRelays}
            <Field icon="fa-database" label="Select which relays to publish to">
              <div>
                {#each values.relays as url}
                  <div
                    class="mb-2 mr-1 inline-block rounded-full border border-solid border-gray-1 px-2 py-1">
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
          <Anchor tag="button" theme="button" type="submit" class="w-full text-center">Done</Anchor>
        {:else if view === "groups"}
          <div class="mb-4 flex items-center justify-center">
            <Heading>Post to a group</Heading>
          </div>
          {#if canPostPrivately && canPostPublicly}
            <FieldInline label="Post privately">
              <Toggle bind:value={values.shouldWrap} />
              <p slot="info">
                When enabled, your note will only be visible to other members of the group.
              </p>
            </FieldInline>
          {/if}
          <div>Select any groups you'd like to post to:</div>
          <div class="flex flex-col gap-2">
            {#each groupOptions as g (g.address)}
              <Card invertColors interactive on:click={() => setGroup(g.address)}>
                <GroupSummary address={g.address}>
                  <div slot="actions">
                    {#if values.groups.includes(g.address)}
                      <i class="fa fa-circle-check text-accent" />
                    {/if}
                  </div>
                </GroupSummary>
              </Card>
            {/each}
          </div>
          <Anchor tag="button" theme="button" type="submit" class="text-center">Done</Anchor>
        {/if}
      </Content>
    </form>
  </Modal>
{/if}
