<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {getListTags, createEvent, getPubkeyTagValues, MUTES} from "@welshman/util"
  import {pubkey, signer, userMutes, tagPubkey, publishThunk} from "@welshman/app"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {pushToast} from "@app/toast"
  import {SETTINGS, PLATFORM_NAME, userSettingValues} from "@app/state"

  const reset = () => {
    mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
    settings = {...$userSettingValues}
  }

  const onSubmit = async () => {
    publishThunk({
      event: createEvent(SETTINGS, {
        content: await $signer!.nip04.encrypt($pubkey!, JSON.stringify(settings)),
      }),
      relays: ctx.app.router.FromUser().getUrls(),
    })

    publishThunk({
      event: createEvent(MUTES, {tags: mutedPubkeys.map(tagPubkey)}),
      relays: ctx.app.router.FromUser().getUrls(),
    })

    pushToast({message: "Your settings have been saved!"})
  }

  let settings = {...$userSettingValues}
  let mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
</script>

<form class="content column gap-4" on:submit|preventDefault={onSubmit}>
  <div class="card2 bg-alt col-4 shadow-xl">
    <p class="text-lg">Content Settings</p>
    <FieldInline>
      <p slot="label">Hide sensitive content?</p>
      <input
        slot="input"
        type="checkbox"
        class="toggle toggle-primary"
        bind:checked={settings.hide_sensitive} />
      <p slot="info">
        If content is marked by the author as sensitive, {PLATFORM_NAME} will hide it by default.
      </p>
    </FieldInline>
    <FieldInline>
      <p slot="label">Show media?</p>
      <input
        slot="input"
        type="checkbox"
        class="toggle toggle-primary"
        bind:checked={settings.show_media} />
      <p slot="info">Use this to disable link previews and image rendering.</p>
    </FieldInline>
    <Field>
      <p slot="label">Muted Accounts</p>
      <div slot="input">
        <ProfileMultiSelect bind:value={mutedPubkeys} />
      </div>
    </Field>
    <p class="text-lg">Editor Settings</p>
    <FieldInline>
      <p slot="label">Send Delay</p>
      <input
        class="range range-primary"
        slot="input"
        type="range"
        min="0"
        max="10000"
        step="1000"
        bind:value={settings.send_delay} />
      <p slot="info">
        Delay sending chat messages for {settings.send_delay / 1000}
        {settings.send_delay === 1000 ? "second" : "seconds"}.
      </p>
    </FieldInline>
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" on:click={reset}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  </div>
</form>
