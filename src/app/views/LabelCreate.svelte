<script lang="ts">
  import {_} from "svelte-i18n"
  import {identity} from "@welshman/lib"
  import {makeEvent} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {pubkey, topicSearch, publishThunk} from "@welshman/app"
  import {showWarning, showInfo} from "src/partials/Toast.svelte"
  import Heading from "src/partials/Heading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import {router} from "src/app/util/router"
  import {loadLabels, getClientTags, deriveCollections, collectionSearch} from "src/engine"

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

  const submit = () => {
    if (names.length === 0) {
      return showWarning($_("labelCreate.selectCollection"))
    }

    const tags = [
      ["e", id],
      ["L", "#t"],
      ...names.map(name => ["l", name, "#t"]),
      ...getClientTags(),
    ]

    publishThunk({
      event: makeEvent(1985, {tags}),
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    })

    showInfo($_("labelCreate.tagSaved"))
    router.pop()
  }

  let topicInput
  let names = []

  $: options = $collections.map(c => c.name)

  loadLabels([$pubkey])
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <Heading class="text-center">{$_("labelCreate.addToCollection")}</Heading>
    <p class="text-center">
      {$_("labelCreate.addNote")}
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
        <div slot="info">{$_("labelCreate.searchTopics")}</div>
      </Field>
    </div>
    <div class="flex justify-end">
      <Button class="btn" type="submit">Save</Button>
    </div>
  </FlexColumn>
</form>
