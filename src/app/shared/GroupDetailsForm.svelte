<script context="module" lang="ts">
  export type Values = {
    id?: string
    type: string
    relays: string[]
    members?: Person[]
    list_publicly: boolean
    meta: {
      name: string
      about: string
      picture: string
      banner: string
    }
  }
</script>

<script lang="ts">
  import {pluck} from "ramda"
  import {ucFirst} from "hurdak"
  import {fly} from "src/util/transition"
  import {toast} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import type {Person} from "src/engine"
  import {searchRelays, normalizeRelayUrl} from "src/engine"

  export let onSubmit
  export let values: Values
  export let mode = "create"
  export let showMembers = false
  export let buttonText = "Save"

  const searchRelayUrls = q => pluck("url", $searchRelays(q))

  const submit = async () => {
    if (values.relays.length < 1) {
      toast.show("error", "At least one relay is required.")

      return
    }

    await onSubmit(values)

    toast.show("info", "Your group has been saved!")
  }

  document.title = "Create Group"
</script>

<form on:submit|preventDefault={submit} in:fly={{y: 20}}>
  <FlexColumn>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>{ucFirst(mode)} Group</Heading>
      <p>
        {#if values.type === "open"}
          An open forum where anyone can participate.
        {:else}
          A private place where members can talk.
        {/if}
      </p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <Field label="Name">
        <Input bind:value={values.meta.name}>
          <i slot="before" class="fa fa-clipboard" />
        </Input>
        <div slot="info">The name of the group</div>
      </Field>
      <Field label="Picture">
        <ImageInput
          bind:value={values.meta.picture}
          icon="image-portrait"
          maxWidth={480}
          maxHeight={480} />
        <div slot="info">A picture for the group</div>
      </Field>
      <Field label="Banner">
        <ImageInput
          bind:value={values.meta.banner}
          icon="image"
          maxWidth={4000}
          maxHeight={4000} />
        <div slot="info">A banner image for the group</div>
      </Field>
      <Field label="About">
        <Textarea bind:value={values.meta.about} />
        <div slot="info">The group's decription</div>
      </Field>
      {#if values.type === "closed"}
        <FieldInline label="List Publicly">
          <Toggle bind:value={values.list_publicly} />
          <div slot="info">
            If enabled, this will generate a public listing for the group. The member list and group
            messages will not be published.
          </div>
        </FieldInline>
      {/if}
      <Field label="Relays">
        <SearchSelect
          multiple
          search={searchRelayUrls}
          bind:value={values.relays}
          termToItem={normalizeRelayUrl}>
          <i slot="before" class="fa fa-clipboard" />
        </SearchSelect>
        <div slot="info">
          Which relays members should publish notes to. For additional privacy, select relays you
          host yourself.
        </div>
      </Field>
      {#if showMembers}
        <Field label="Member List">
          <PersonMultiSelect bind:value={values.members} />
          <div slot="info">All members will receive a fresh invitation with a new key.</div>
        </Field>
      {/if}
      <Anchor button tag="button" type="submit">{buttonText}</Anchor>
    </div>
  </FlexColumn>
</form>
