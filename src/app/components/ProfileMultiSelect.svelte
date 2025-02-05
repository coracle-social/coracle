<script lang="ts">
  import {writable} from "svelte/store"
  import {type Instance} from "tippy.js"
  import {append, remove, uniq} from "@welshman/lib"
  import {profileSearch} from "@welshman/app"
  import Suggestions from "@lib/components/Suggestions.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import ProfileSuggestion from "@app/editor/ProfileSuggestion.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {pushModal} from "@app/modal"

  interface Props {
    value: string[]
    autofocus?: boolean
  }

  let {value = $bindable(), autofocus = false}: Props = $props()

  const term = writable("")

  const search = (term: string) => $profileSearch.searchValues(term)

  const selectPubkey = (pubkey: string) => {
    term.set("")
    popover?.hide()
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

  let input: Element | undefined = $state()
  let popover: Instance | undefined = $state()
  let instance: any = $state()

  $effect(() => {
    if ($term) {
      popover?.show()
    } else {
      popover?.hide()
    }
  })
</script>

<div class="flex flex-col gap-2">
  <div>
    {#each value as pubkey (pubkey)}
      {@const onClick = () => pushModal(ProfileDetail, {pubkey})}
      <div class="flex-inline badge badge-neutral mr-1 gap-1">
        <Button class="flex items-center" onclick={() => removePubkey(pubkey)}>
          <Icon icon="close-circle" size={4} class="-ml-1 mt-px" />
        </Button>
        <Button onclick={onClick}>
          <ProfileName {pubkey} />
        </Button>
      </div>
    {/each}
  </div>
  <label class="input input-bordered flex w-full items-center gap-2" bind:this={input}>
    <Icon icon="magnifer" />
    <!-- svelte-ignore a11y_autofocus -->
    <input
      {autofocus}
      class="grow"
      type="text"
      placeholder="Search for profiles..."
      bind:value={$term}
      onkeydown={onKeyDown} />
  </label>
  <Tippy
    bind:popover
    bind:instance
    component={Suggestions}
    props={{
      term,
      search,
      select: selectPubkey,
      component: ProfileSuggestion,
      class: "rounded-box",
      style: `left: 4px; width: ${input?.clientWidth + 12}px`,
    }}
    params={{
      trigger: "manual",
      interactive: true,
      maxWidth: "none",
      getReferenceClientRect: () => input!.getBoundingClientRect(),
    }} />
</div>
