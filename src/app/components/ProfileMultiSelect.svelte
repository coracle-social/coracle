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

  export let value: string[]

  let term = ""
  let input: Element
  let popover: Instance
  let instance: SvelteComponent

  const selectPubkey = (pubkey: string) => {
    term = ""
    popover.hide()
    value = uniq(append(pubkey, value))
  }

  const removePubkey = (pubkey: string) => {
    value = remove(pubkey, value)
  }

  const onKeyDown = (e: Event) => {
    if (instance.onKeyDown(e)) {
      e.preventDefault()
    }
  }

  $: {
    if (term) {
      popover?.show()
    } else {
      popover?.hide()
    }
  }
</script>

<div class="flex flex-col gap-2">
  <div>
    {#each value as pubkey (pubkey)}
      <div class="badge badge-neutral mr-1 flex-inline gap-1">
        <Button class="flex items-center" on:click={() => removePubkey(pubkey)}>
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
    <input class="grow" type="text" placeholder="Search for profiles..." bind:value={term} on:keydown={onKeyDown} />
  </label>
  <Tippy
    bind:popover
    bind:instance
    component={Suggestions}
    props={{
      term,
      select: selectPubkey,
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
