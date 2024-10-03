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
  import Name from '@app/components/Name.svelte'
  import {entityLink} from '@app/state'
  import {updateList} from '@app/commands'
  import {pushToast} from '@app/toast'

  let term = ""
  let input: Element
  let popover: Instance
  let instance: SvelteComponent
  let mutedPubkeys = getListValues("p", $userMutes)

  const addMute = (pubkey: string) => {
    term = ""
    popover.hide()
    mutedPubkeys = uniq(append(pubkey, mutedPubkeys))
  }

  const removeMute = (pubkey: string) => {
    mutedPubkeys = remove(pubkey, mutedPubkeys)
  }

  const onKeyDown = (e: Event) => {
    if (instance.onKeyDown(e)) {
      e.preventDefault()
    }
  }

  const reset = () => {
    mutedPubkeys = getListValues("p", $userMutes)
  }

  const onSubmit = async () => {
    await updateList(MUTES, always(mutedPubkeys.map(tagPubkey)))

    pushToast({message: "Your settings have been saved!"})
  }

  $: {
    if (term) {
      popover?.show()
    } else {
      popover?.hide()
    }
  }
</script>

<form class="content column gap-4" on:submit|preventDefault={onSubmit}>
  <div class="card2 bg-alt shadow-xl">
    <Field>
      <p slot="label">Muted Accounts</p>
      <div slot="input" class="flex flex-col gap-2">
        <div>
          {#each mutedPubkeys as pubkey (pubkey)}
            <div class="badge badge-neutral mr-1 flex-inline gap-1">
              <Button on:click={() => removeMute(pubkey)}>
                <Icon icon="close-circle" size={4} class="-ml-1 mt-px" />
              </Button>
              <Link href={entityLink(nip19.npubEncode(pubkey))}>
                <Name {pubkey} />
              </Link>
            </div>
          {/each}
        </div>
        <label class="input input-bordered flex w-full items-center gap-2" bind:this={input}>
          <Icon icon="magnifer" />
          <input class="grow" type="text" bind:value={term} on:keydown={onKeyDown} />
        </label>
        <Tippy
          bind:popover
          bind:instance
          component={Suggestions}
          props={{
            term,
            select: addMute,
            search: profileSearch,
            component: SuggestionProfile,
            class: 'rounded-box',
            style: `left: 4px; width: ${input?.clientWidth + 12}px`,
          }}
          params={{
            trigger: "manual",
            interactive: true,
            maxWidth: 'none',
            getReferenceClientRect: () => input.getBoundingClientRect(),
          }}
        />
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
