<script lang="ts">
  import {
    getListTags,
    tagger,
    createEvent,
    getPubkeyTagValues,
    getTagValues,
    MUTES,
    BLOSSOM_SERVERS,
  } from "@welshman/util"
  import {Router} from "@welshman/router"
  import {
    pubkey,
    signer,
    userMutes,
    tagPubkey,
    publishThunk,
    userBlossomServers,
  } from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import InputList from "@lib/components/InputList.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {pushToast} from "@app/toast"
  import {SETTINGS, PLATFORM_NAME, userSettingValues} from "@app/state"

  const reset = () => {
    settings = {...$userSettingValues}
    mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
    blossomServers = getTagValues("server", getListTags($userBlossomServers))
  }

  const onsubmit = preventDefault(async () => {
    const json = JSON.stringify($state.snapshot(settings))
    const content = await $signer!.nip44.encrypt($pubkey!, json)
    const relays = Router.get().FromUser().getUrls()

    publishThunk({
      event: createEvent(SETTINGS, {content}),
      relays,
    })

    publishThunk({
      event: createEvent(MUTES, {tags: mutedPubkeys.map(tagPubkey)}),
      relays,
    })

    publishThunk({
      event: createEvent(BLOSSOM_SERVERS, {tags: blossomServers.map(tagger("server"))}),
      relays,
    })

    pushToast({message: "Your settings have been saved!"})
  })

  let settings = $state({...$userSettingValues})
  let mutedPubkeys = $state(getPubkeyTagValues(getListTags($userMutes)))
  let blossomServers = $state(getTagValues("server", getListTags($userBlossomServers)))

  $inspect(blossomServers)
</script>

<form class="content column gap-4" {onsubmit}>
  <div class="card2 bg-alt col-4 shadow-xl">
    <strong class="text-lg">Content Settings</strong>
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
    <strong class="text-lg">Privacy Settings</strong>
    <FieldInline>
      {#snippet label()}
        <p>Report errors?</p>
      {/snippet}
      {#snippet input()}
        <input
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={settings.report_errors} />
      {/snippet}
      {#snippet info()}
        <p>
          Allow {PLATFORM_NAME} to send error reports to help improve the app.
        </p>
      {/snippet}
    </FieldInline>
    <FieldInline>
      {#snippet label()}
        <p>Report usage?</p>
      {/snippet}
      {#snippet input()}
        <input type="checkbox" class="toggle toggle-primary" bind:checked={settings.report_usage} />
      {/snippet}
      {#snippet info()}
        <p>
          Allow {PLATFORM_NAME} to collect anonymous usage data.
        </p>
      {/snippet}
    </FieldInline>
    <strong class="text-lg">Editor Settings</strong>
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
        <InputList bind:value={blossomServers}>
          {#snippet addLabel()}
            Add Server
          {/snippet}
        </InputList>
      {/snippet}
      {#snippet info()}
        <p>Choose a media server type and url for files you upload to {PLATFORM_NAME}.</p>
      {/snippet}
    </Field>
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" onclick={reset}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  </div>
</form>
