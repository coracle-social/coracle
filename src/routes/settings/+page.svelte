<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {getListTags, createEvent, getPubkeyTagValues, MUTES} from "@welshman/util"
  import {pubkey, signer, userMutes, tagPubkey, publishThunk} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {pushToast} from "@app/toast"
  import {SETTINGS, PLATFORM_NAME, userSettingValues} from "@app/state"

  const reset = () => {
    mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
    settings = {...$userSettingValues}
  }

  const onsubmit = preventDefault(async () => {
    const json = JSON.stringify($state.snapshot(settings))
    const content = await $signer!.nip04.encrypt($pubkey!, json)

    publishThunk({
      event: createEvent(SETTINGS, {content}),
      relays: ctx.app.router.FromUser().getUrls(),
    })

    publishThunk({
      event: createEvent(MUTES, {tags: mutedPubkeys.map(tagPubkey)}),
      relays: ctx.app.router.FromUser().getUrls(),
    })

    pushToast({message: "Your settings have been saved!"})
  })

  let settings = $state({...$userSettingValues})
  let mutedPubkeys = $state(getPubkeyTagValues(getListTags($userMutes)))
</script>

<form class="content column gap-4" {onsubmit}>
  <div class="card2 bg-alt col-4 shadow-xl">
    <p class="text-lg">Content Settings</p>
    <FieldInline>
      {#snippet label()}
        <p>Hide sensitive content?</p>
      {/snippet}
      {#snippet input()}
        <input
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={settings.hide_sensitive} />
      {/snippet}
      {#snippet info()}
        <p>
          If content is marked by the author as sensitive, {PLATFORM_NAME} will hide it by default.
        </p>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Show media?</p>
      {/snippet}
      {#snippet input()}
        <input type="checkbox" class="toggle toggle-primary" bind:checked={settings.show_media} />
      {/snippet}
      {#snippet info()}
        <p>Use this to disable link previews and image rendering.</p>
      {/snippet}
    </FieldInline>
    <Field>
      {#snippet label()}
        <p>Muted Accounts</p>
      {/snippet}
      {#snippet input()}
        <div>
          <ProfileMultiSelect bind:value={mutedPubkeys} />
        </div>
      {/snippet}
    </Field>
    <p class="text-lg">Editor Settings</p>
    <FieldInline>
      {#snippet label()}
        <p>Send Delay</p>
      {/snippet}
      {#snippet input()}
        <input
          class="range range-primary"
          type="range"
          min="0"
          max="10000"
          step="1000"
          bind:value={settings.send_delay} />
      {/snippet}
      {#snippet info()}
        <p>
          Delay sending chat messages for {settings.send_delay / 1000}
          {settings.send_delay === 1000 ? "second" : "seconds"}.
        </p>
      {/snippet}
    </FieldInline>
    <Field>
      {#snippet label()}
        <p>Media Server</p>
      {/snippet}
      {#snippet input()}
        <div class="flex flex-col gap-2 lg:flex-row">
          <select bind:value={settings.upload_type} class="select select-bordered">
            <option value="nip96">NIP 96 (default)</option>
            <option value="blossom">Blossom</option>
          </select>
          <label class="input input-bordered flex flex-grow items-center gap-2">
            <Icon icon="link-round" />
            {#if settings.upload_type === "nip96"}
              <input class="grow" bind:value={settings.nip96_urls[0]} />
            {:else}
              <input class="grow" bind:value={settings.blossom_urls[0]} />
            {/if}
          </label>
        </div>
      {/snippet}
      {#snippet info()}
        <p>Choose a media server type and url for files you upload to flotilla.</p>
      {/snippet}
    </Field>
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" onclick={reset}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  </div>
</form>
