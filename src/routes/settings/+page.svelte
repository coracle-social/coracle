<script lang="ts">
  import {nip19} from 'nostr-tools'
  import type {SvelteComponent} from 'svelte'
  import tippy, {type Instance} from "tippy.js"
  import {append, always, remove, uniq} from '@welshman/lib'
  import {getListValues, MUTES} from '@welshman/util'
  import {userMutes, profileSearch, tagPubkey} from '@welshman/app'
  import Icon from '@lib/components/Icon.svelte'
  import Field from '@lib/components/Field.svelte'
  import Tippy from '@lib/components/Tippy.svelte'
  import Link from '@lib/components/Link.svelte'
  import Button from '@lib/components/Button.svelte'
  import Suggestions from '@lib/editor/Suggestions.svelte'
  import SuggestionProfile from '@lib/editor/SuggestionProfile.svelte'
  import ProfileMultiSelect from '@app/components/ProfileMultiSelect.svelte'
  import {entityLink} from '@app/state'
  import {updateList} from '@app/commands'
  import {pushToast} from '@app/toast'

  let mutedPubkeys = getListValues("p", $userMutes)

  const reset = () => {
    mutedPubkeys = getListValues("p", $userMutes)
  }

  const onSubmit = async () => {
    await updateList(MUTES, always(mutedPubkeys.map(tagPubkey)))

    pushToast({message: "Your settings have been saved!"})
  }
</script>

<form class="content column gap-4" on:submit|preventDefault={onSubmit}>
  <div class="card2 bg-alt shadow-xl">
    <Field>
      <p slot="label">Muted Accounts</p>
      <div slot="input">
        <ProfileMultiSelect bind:value={mutedPubkeys} />
      </div>
    </Field>
    <div class="flex flex-row items-center justify-between gap-4 mt-4">
      <Button class="btn btn-neutral" on:click={reset}>
        Discard Changes
      </Button>
      <Button type="submit" class="btn btn-primary">
        Save Changes
      </Button>
    </div>
  </div>
</form>
