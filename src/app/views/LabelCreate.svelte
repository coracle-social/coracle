<script lang="ts">
  import {identity, noop} from "@welshman/lib"
  import {publish} from "@welshman/app"
  import {showWarning, showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import {router} from "src/app/util/router"
  import {command, pubkey, topicSearch, writer} from "src/engine/core"
  import {loadLabels, getClientTags, deriveCollections, collectionSearch} from "src/engine"
  import {Label} from "src/domain"

  export let id

  const collections = deriveCollections($pubkey)

  const onTopicChange = name => {
    if (name) {
      topicInput.clear()
      names = names.concat(name)
      options = options.concat(name)
    }
  }

  const onNamesChange = newNames => {
    names = newNames
  }

  const submit = async () => {
    if (names.length === 0) {
      return showWarning("Please select at least one collection.")
    }

    const eventWriter = writer(Label).setEventId(id)

    for (const name of names) {
      eventWriter.addLabel(name, "#t")
    }

    eventWriter.addTags(...getClientTags())

    await command(eventWriter).then(publish)

    showInfo("Your tag has been saved!")
    router.pop()
  }

  let topicInput
  let names = []

  $: options = $collections.map(c => c.name)

  if ($pubkey) {
    loadLabels([$pubkey]).catch(noop)
  }
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Heading class="text-center">Add to collection</Heading>
    <p class="text-center">
      Add this note to your collections. You can find your collections on your profile page.
    </p>
    <SelectButton
      multiple
      value={names}
      {options}
      onChange={onNamesChange}
      displayOption={$collectionSearch.displayValue} />
    <div class="flex w-full flex-col gap-8">
      <Field label="Collections">
        <SearchSelect
          bind:this={topicInput}
          search={$topicSearch.searchValues}
          termToItem={identity}
          onChange={onTopicChange} />
        <div slot="info">Search for existing topics, or create your own.</div>
      </Field>
    </div>
    <div class="flex justify-end">
      <Button class="btn" type="submit">Save</Button>
    </div>
  </FlexColumn>
</form>
