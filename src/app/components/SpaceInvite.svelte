<script lang="ts">
  import {onMount} from 'svelte'
  import {goto} from "$app/navigation"
  import {sleep, identity, nthEq} from "@welshman/lib"
  import {load} from "@welshman/app"
  import {displayRelayUrl, AUTH_INVITE} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {slide} from '@lib/transition'
  import Spinner from "@lib/components/Spinner.svelte"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushModal} from '@app/modal'
  import {clip} from '@app/toast'

  export let url

  const back = () => history.back()

  const copyInvite = () => clip(invite)

  let claim = ""
  let loading = true

  $: invite = [displayRelayUrl(url), claim].filter(identity).join("|")

  onMount(async () => {
    const [[event]] = await Promise.all([
      load({filters: [{kinds: [AUTH_INVITE]}], relays: [url]}),
      sleep(2000),
    ])

    claim = event?.tags.find(nthEq(0, 'claim'))?.[1] || ""
    loading = false
  })
</script>

<div class="col-4">
  <ModalHeader>
    <div slot="title">
      Create an Invite
    </div>
    <div slot="info">
      Get a link that you can use to invite people to
      <span class="text-primary">{displayRelayUrl(url)}</span>
    </div>
  </ModalHeader>
  <div>
    {#if loading}
      <p class="center" out:slide>
        <Spinner {loading}>Requesting an invite code...</Spinner>
      </p>
    {:else}
      <div in:slide>
        <Field>
          <label class="input input-bordered flex w-full items-center gap-2" slot="input">
            <Icon icon="link-round" />
            <input bind:value={invite} class="grow" type="text" />
            <Button on:click={copyInvite}>
              <Icon icon="copy" />
            </Button>
          </label>
          <p slot="info">
            This invite link can be used by clicking "Add Space" and pasting it there.
            {#if !claim}
              This space did not issue a claim for this link, so additional steps might be
              required for people using this invite link.
            {/if}
          </p>
        </Field>
      </div>
    {/if}
  </div>
  <ModalFooter>
    <Button class="btn btn-primary flex-grow" on:click={back}>Done</Button>
  </ModalFooter>
</div>
