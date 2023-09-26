<script lang="ts">
  import {onMount} from "svelte"
  import {pluck, identity} from "ramda"
  import {fly} from "src/util/transition"
  import {Tags} from "src/util/nostr"
  import {toast, appName} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import Content from "src/partials/Content.svelte"
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

  const muteTags = Tags.wrap($user.mutes || [])

  let settings = getSettings()
  let mutedPeople = muteTags.type("p").values().all().map(getPersonWithDefault)

  const searchWords = q => pluck("name", $searchTopics(q))

  const submit = () => {
    const pubkeyMutes = mutedPeople.map(p => ["p", p.pubkey])
    const otherMutes = muteTags.type("p", {reject: true}).all()
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

<form on:submit|preventDefault={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>Content Settings</Heading>
      <p>Control who and what you see on {appName}.</p>
    </div>
    <div class="flex w-full flex-col gap-8">
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
      <Field label="Muted accounts">
        <PersonMultiSelect bind:value={mutedPeople} />
        <p slot="info">Notes from these people will be hidden by default.</p>
      </Field>
      <Field label="Muted words and topics">
        <MultiSelect bind:value={settings.muted_words} search={searchWords} termToItem={identity} />
        <p slot="info">Notes containing these words will be hidden by default.</p>
      </Field>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
