<script lang="ts">
  import {onMount} from "svelte"
  import {pluck, identity} from "ramda"
  import {Tags} from "paravel"
  import {toast, appName} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {
    user,
    getSettings,
    publishSettings,
    searchTopics,
    mutes,
    getPersonWithDefault,
    loadPubkeys,
    publishMutes,
  } from "src/engine"

  const muteTags = new Tags($user.mutes || [])

  let settings = getSettings()
  let mutedPeople = muteTags.type("p").values().uniq().all().map(getPersonWithDefault)

  const searchWords = q => pluck("name", $searchTopics(q))

  const submit = () => {
    const pubkeyMutes = mutedPeople.map(p => ["p", p.pubkey])
    const otherMutes = muteTags.reject(t => t[0] === "p").all()
    const allMutes = [...pubkeyMutes, ...otherMutes]

    publishSettings(settings)
    publishMutes(allMutes)

    toast.show("info", "Your preferences have been saved!")
  }

  onMount(() => {
    loadPubkeys(Array.from($mutes))
  })

  document.title = "Content Preferences"
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>Content Settings</Heading>
    <p>Control who and what you see on {appName}.</p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <FieldInline label="Show likes on notes">
      <Toggle bind:value={settings.enable_reactions} />
      <p slot="info">
        Show how many likes and reactions a note received. Disabling this can reduce how much data {appName}
        uses.
      </p>
    </FieldInline>
    <FieldInline label="Show images and link previews">
      <Toggle bind:value={settings.show_media} />
      <p slot="info">
        If enabled, {appName} will automatically show images and previews for embedded links.
      </p>
    </FieldInline>
    <FieldInline label="Hide sensitive content">
      <Toggle bind:value={settings.hide_sensitive} />
      <p slot="info">
        If enabled, content flagged by the author as potentially sensitive will be hidden.
      </p>
    </FieldInline>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>Minimum WoT score</strong>
        <div>{settings.min_wot_score}</div>
      </div>
      <Input type="range" bind:value={settings.min_wot_score} min={-10} max={10} />
      <p slot="info">
        Select a minimum <Anchor underline modal href="/help/web-of-trust"
          >web-of-trust</Anchor>
        score. Notes from accounts with a lower score will be automatically hidden.
      </p>
    </Field>
    <Field label="Muted accounts">
      <PersonMultiSelect bind:value={mutedPeople} />
      <p slot="info">Notes from these people will be hidden by default.</p>
    </Field>
    <Field label="Muted words and topics">
      <SearchSelect
        multiple
        bind:value={settings.muted_words}
        search={searchWords}
        termToItem={identity} />
      <p slot="info">Notes containing these words will be hidden by default.</p>
    </Field>
    <Anchor button tag="button" type="submit">Save</Anchor>
  </div>
</form>
