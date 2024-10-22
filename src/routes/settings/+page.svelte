<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {getListTags, createEvent, getPubkeyTagValues, MUTES} from "@welshman/util"
  import {pubkey, signer, userMutes, tagPubkey, publishThunk} from "@welshman/app"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {pushToast} from "@app/toast"
  import {SETTINGS, PLATFORM_NAME, userSettings} from "@app/state"

  const settings = {...$userSettings?.values}

  const reset = () => {
    mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  }

  const onSubmit = async () => {
    publishThunk({
      event: createEvent(SETTINGS, {
        content: await $signer!.nip04.encrypt($pubkey!, JSON.stringify(settings)),
      }),
      relays: ctx.app.router.WriteRelays().getUrls(),
    })

    publishThunk({
      event: createEvent(MUTES, {tags: mutedPubkeys.map(tagPubkey)}),
      relays: ctx.app.router.WriteRelays().getUrls(),
    })

    pushToast({message: "Your settings have been saved!"})
  }

  let mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
</script>

<form class="content column gap-4" on:submit|preventDefault={onSubmit}>
  <div class="card2 bg-alt col-4 shadow-xl">
    <Field>
      <p slot="label">Muted Accounts</p>
      <div slot="input">
        <ProfileMultiSelect bind:value={mutedPubkeys} />
      </div>
    </Field>
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
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" on:click={reset}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  </div>
</form>
