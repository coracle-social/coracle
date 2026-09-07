<script lang="ts">
  import {identity, uniq, equals} from "@welshman/lib"
  import {tagSpec, tagValues, userOutbox} from "@welshman/util"
  import {MuteLists} from "@welshman/app"
  import {appName} from "src/partials/state"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import Footer from "src/partials/Footer.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import WorkEstimate from "src/partials/WorkEstimate.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {hasNip44, userSettings, publishSettings} from "src/engine"
  import {deriveUserItem, muteLists, resolveRelays, topicSearch} from "src/engine/core"

  const userMuteList = deriveUserItem(MuteLists)

  const values = {...$userSettings}

  const noteActionOptions = ["zaps", "replies", "reactions", "reposts", "recommended_apps"]

  const setMutesDirty = () => {
    mutesDirty = true
  }

  const submit = async () => {
    try {
      await save()
    } catch (e) {
      console.error(e)

      return showWarning("Your preferences could not be saved")
    }

    showInfo("Your preferences have been saved!")
  }

  // Saving encrypts through the user's signer, which can reject
  const save = async () => {
    if (!equals($userSettings, values) && !mutesDirty) {
      // Migrate away from muted words
      await publishSettings({...values, muted_words: []})
    }

    if (mutesDirty) {
      const eventCommand = await muteLists.get().setMutes({
        privateTags: [
          ...($userMuteList?.privateTags.filter(t => !["p", "t", "word"].includes(t[0])) || []),
          ...privatelyMutedPubkeys.map(v => ["p", v]),
          ...privatelyMutedTopics.map(v => ["t", v]),
          ...privatelyMutedWords.map(v => ["word", v]),
        ],
        publicTags: [
          ...($userMuteList?.publicTags.filter(t => !["p", "t", "word"].includes(t[0])) || []),
          ...publiclyMutedPubkeys.map(v => ["p", v]),
          ...publiclyMutedTopics.map(v => ["t", v]),
          ...publiclyMutedWords.map(v => ["word", v]),
        ],
      })

      eventCommand.publishToRelays(await resolveRelays([userOutbox()]))
    }
  }

  let mutesDirty = false
  let publiclyMutedPubkeys = uniq(tagValues(tagSpec("p"), $userMuteList?.publicTags || []))
  let privatelyMutedPubkeys = uniq(tagValues(tagSpec("p"), $userMuteList?.privateTags || []))
  let publiclyMutedTopics = uniq(tagValues(tagSpec("t"), $userMuteList?.publicTags || []))
  let privatelyMutedTopics = uniq(tagValues(tagSpec("t"), $userMuteList?.privateTags || []))
  let publiclyMutedWords = uniq(tagValues(tagSpec("word"), $userMuteList?.publicTags || []))
  let privatelyMutedWords = uniq([
    ...tagValues(tagSpec("word"), $userMuteList?.privateTags || []),
    ...$userSettings.muted_words,
  ])

  document.title = "Content Preferences"
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>Content Settings</Heading>
    <p>Control who and what you see on {appName}.</p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label="Note actions">
      <SelectButton multiple bind:value={values.note_actions} options={noteActionOptions} />
      <p slot="info">
        Controls which icons appear at the bottom of any given note. Disabling these can reduce how
        much data {appName} uses.
      </p>
    </Field>
    <FieldInline label="Show media">
      <Toggle bind:value={values.show_media} />
      <p slot="info">
        If enabled, {appName} will automatically show images, video, and audio embedded in notes.
      </p>
    </FieldInline>
    <FieldInline label="Show link previews">
      <Toggle bind:value={values.show_link_previews} />
      <p slot="info">
        If enabled, {appName} will show a preview card for links to other websites. If disabled, they
        appear as plain hyperlinks. This only applies when media is shown.
      </p>
    </FieldInline>
    <FieldInline label="Hide sensitive content">
      <Toggle bind:value={values.hide_sensitive} />
      <p slot="info">
        If enabled, content flagged by the author as potentially sensitive will be hidden.
      </p>
    </FieldInline>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>Minimum WoT score</strong>
        <div>{values.min_wot_score}</div>
      </div>
      <Input type="range" bind:value={values.min_wot_score} min={-10} max={10} />
      <p slot="info">
        Select a minimum <Link class="underline" modal href="/help/web-of-trust">web-of-trust</Link>
        score. Notes from accounts with a lower score will be automatically hidden.
      </p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>Minimum Proof of Work</strong>
        <div>
          difficulty {values.min_pow_difficulty} (<WorkEstimate
            difficulty={values.min_pow_difficulty} />)
        </div>
      </div>
      <Input type="range" bind:value={values.min_pow_difficulty} min={0} max={32} />
      <p slot="info">
        Select a minimum proof-of-work difficulty for notes from people outside your network. If a
        note fails to meet both your minimum web of trust score and minimum proof-of-work
        difficulty, it will be hidden.
      </p>
    </Field>
    <p>Mutes</p>
    <Field label="Publicly muted accounts">
      <PersonSelect multiple bind:value={publiclyMutedPubkeys} onChange={setMutesDirty} />
      <p slot="info">
        Notes from these people will be hidden by default. This information may be used to identify
        impersonators and spammers.
      </p>
    </Field>
    <Field label="Privately muted accounts">
      <PersonSelect multiple bind:value={privatelyMutedPubkeys} onChange={setMutesDirty} />
      <p slot="info">
        Notes from these people will be hidden by default. This information will be encrypted.
      </p>
    </Field>
    <Field label="Publicly muted words">
      <SearchSelect
        multiple
        bind:value={publiclyMutedWords}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        Notes containing these words will be hidden by default. This information may be used to
        identify impersonators and spammers.
      </p>
    </Field>
    <Field label="Privately muted words">
      <SearchSelect
        multiple
        bind:value={privatelyMutedWords}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        Notes containing these words will be hidden by default. This information will be encrypted.
      </p>
    </Field>
    <Field label="Publicly muted topics">
      <SearchSelect
        multiple
        bind:value={publiclyMutedTopics}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        Notes tagging these topics will be hidden by default. This information may be used to
        identify impersonators and spammers.
      </p>
    </Field>
    <Field label="Privately muted topics">
      <SearchSelect
        multiple
        bind:value={privatelyMutedTopics}
        search={$topicSearch.searchValues}
        onChange={setMutesDirty}
        termToItem={identity} />
      <p slot="info">
        Notes tagging these topics will be hidden by default. This information will be encrypted.
      </p>
    </Field>
    {#if !$hasNip44}
      <p class="text-center">
        Your signer doesn't support encryption, so {appName} can't save your preferences.
      </p>
    {/if}
  </div>
  <Footer>
    <!-- Settings and private mutes are nip 44 encrypted now, so a signer without it can't save -->
    <Button class="btn flex-grow" type="submit" disabled={!$hasNip44}>Save</Button>
  </Footer>
</form>
