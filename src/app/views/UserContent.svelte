<script lang="ts">
  import {_} from "svelte-i18n"
  import {identity, uniq, equals} from "@welshman/lib"
  import {tagger, getTagValues} from "@welshman/util"
  import {topicSearch, setMutes, userMuteList} from "@welshman/app"
  import {appName} from "src/partials/state"
  import {showInfo} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import Footer from "src/partials/Footer.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import WorkEstimate from "src/partials/WorkEstimate.svelte"
  import Button from "src/partials/Button.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {userSettings, publishSettings} from "src/engine"

  const values = {...$userSettings}

  const noteActionOptions = ["zaps", "replies", "reactions", "recommended_apps"]

  const setMutesDirty = () => {
    mutesDirty = true
  }

  const submit = () => {
    if (!equals($userSettings, values) && !mutesDirty) {
      // Migrate away from muted words
      publishSettings({...values, muted_words: []})
    }

    if (mutesDirty) {
      setMutes({
        privateTags: [
          ...($userMuteList?.privateTags.filter(t => !["p", "t", "word"].includes(t[0])) || []),
          ...privatelyMutedPubkeys.map(tagger("p")),
          ...privatelyMutedTopics.map(tagger("t")),
          ...privatelyMutedWords.map(tagger("word")),
        ],
        publicTags: [
          ...($userMuteList?.publicTags.filter(t => !["p", "t", "word"].includes(t[0])) || []),
          ...publiclyMutedPubkeys.map(tagger("p")),
          ...publiclyMutedTopics.map(tagger("t")),
          ...publiclyMutedWords.map(tagger("word")),
        ],
      })
    }

    showInfo($_("content.saved"))
  }

  let mutesDirty = false
  let publiclyMutedPubkeys = uniq(getTagValues("p", $userMuteList?.publicTags || []))
  let privatelyMutedPubkeys = uniq(getTagValues("p", $userMuteList?.privateTags || []))
  let publiclyMutedTopics = uniq(getTagValues("t", $userMuteList?.publicTags || []))
  let privatelyMutedTopics = uniq(getTagValues("t", $userMuteList?.privateTags || []))
  let publiclyMutedWords = uniq(getTagValues("word", $userMuteList?.publicTags || []))
  let privatelyMutedWords = uniq([
    ...getTagValues("word", $userMuteList?.privateTags || []),
    ...$userSettings.muted_words,
  ])

  document.title = $_("content.title")
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>{$_("content.heading")}</Heading>
    <p>{$_("content.description", {values: {appName}})}</p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label={$_("content.noteActions")}>
      <SelectButton multiple bind:value={values.note_actions} options={noteActionOptions} />
      <p slot="info">
        {$_("content.noteActionsInfo", {values: {appName}})}
      </p>
    </Field>
    <FieldInline label={$_("content.showMedia")}>
      <Toggle bind:value={values.show_media} />
      <p slot="info">
        {$_("content.showMediaInfo", {values: {appName}})}
      </p>
    </FieldInline>
    <FieldInline label={$_("content.hideSensitive")}>
      <Toggle bind:value={values.hide_sensitive} />
      <p slot="info">
        {$_("content.hideSensitiveInfo")}
      </p>
    </FieldInline>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("content.minWotScore")}</strong>
        <div>{values.min_wot_score}</div>
      </div>
      <Input type="range" bind:value={values.min_wot_score} min={-10} max={10} />
      <p slot="info">
        {$_("content.minWotScoreInfo")}
      </p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("content.minPow")}</strong>
        <div>
          difficulty {values.min_pow_difficulty} (<WorkEstimate
            difficulty={values.min_pow_difficulty} />)
        </div>
      </div>
      <Input type="range" bind:value={values.min_pow_difficulty} min={0} max={32} />
      <p slot="info">
        {$_("content.minPowInfo")}
      </p>
    </Field>
    <p>{$_("content.mutes")}</p>
    <Field label={$_("content.publiclyMutedAccounts")}>
      <PersonSelect multiple bind:value={publiclyMutedPubkeys} onChange={setMutesDirty} />
      <p slot="info">
        {$_("content.publiclyMutedAccountsInfo")}
      </p>
    </Field>
    <Field label={$_("content.privatelyMutedAccounts")}>
      <PersonSelect multiple bind:value={privatelyMutedPubkeys} onChange={setMutesDirty} />
      <p slot="info">
        {$_("content.privatelyMutedAccountsInfo")}
      </p>
    </Field>
    <Field label={$_("content.publiclyMutedWords")}>
      <SearchSelect
        multiple
        bind:value={publiclyMutedWords}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        {$_("content.publiclyMutedWordsInfo")}
      </p>
    </Field>
    <Field label={$_("content.privatelyMutedWords")}>
      <SearchSelect
        multiple
        bind:value={privatelyMutedWords}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        {$_("content.privatelyMutedWordsInfo")}
      </p>
    </Field>
    <Field label={$_("content.publiclyMutedTopics")}>
      <SearchSelect
        multiple
        bind:value={publiclyMutedTopics}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        {$_("content.publiclyMutedTopicsInfo")}
      </p>
    </Field>
    <Field label={$_("content.privatelyMutedTopics")}>
      <SearchSelect
        multiple
        bind:value={privatelyMutedTopics}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        {$_("content.privatelyMutedTopicsInfo")}
      </p>
    </Field>
  </div>
  <Footer>
    <Button class="btn flex-grow" type="submit">Save</Button>
  </Footer>
</form>
