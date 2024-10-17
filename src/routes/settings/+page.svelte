<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {getListTags, createEvent, getPubkeyTagValues, MUTES} from "@welshman/util"
  import {userMutes, tagPubkey, publishThunk} from "@welshman/app"
  import Field from "@lib/components/Field.svelte"
  import FieldInline from "@lib/components/FieldInline.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {pushToast} from "@app/toast"

  let mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))

  const reset = () => {
    mutedPubkeys = getPubkeyTagValues(getListTags($userMutes))
  }

  const onSubmit = async () => {
    publishThunk({
      event: createEvent(MUTES, {tags: mutedPubkeys.map(tagPubkey)}),
      relays: ctx.app.router.WriteRelays().getUrls(),
    })

    pushToast({message: "Your settings have been saved!"})
  }
</script>

<form class="content column gap-4" on:submit|preventDefault={onSubmit}>
  <div class="card2 bg-alt shadow-xl col-4">
    <Field>
      <p slot="label">Muted Accounts</p>
      <div slot="input">
        <ProfileMultiSelect bind:value={mutedPubkeys} />
      </div>
    </Field>
    <FieldInline>
      <p slot="label">Hide sensitive content?</p>
      <input slot="input" type="checkbox" class="toggle toggle-primary" checked="checked" />
      <p slot="info">If content is marked by the author as sensitive, flotilla will hide it by default.</p>
    </FieldInline>
    <div class="mt-4 flex flex-row items-center justify-between gap-4">
      <Button class="btn btn-neutral" on:click={reset}>Discard Changes</Button>
      <Button type="submit" class="btn btn-primary">Save Changes</Button>
    </div>
  </div>
</form>
