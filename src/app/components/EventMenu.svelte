<script lang="ts">
  import {onMount} from "svelte"
  import type {Snippet} from "svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {COMMENT} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import EventInfo from "@app/components/EventInfo.svelte"
  import EventReport from "@app/components/EventReport.svelte"
  import EventShare from "@app/components/EventShare.svelte"
  import EventDeleteConfirm from "@app/components/EventDeleteConfirm.svelte"
  import {pushModal} from "@app/modal"

  type Props = {
    url: string
    noun: string
    event: TrustedEvent
    onClick: () => void
    customActions?: Snippet
  }

  const {url, noun, event, onClick, customActions}: Props = $props()

  const isRoot = event.kind !== COMMENT

  const report = () => pushModal(EventReport, {url, event})

  const showInfo = () => pushModal(EventInfo, {url, event})

  const share = () => pushModal(EventShare, {url, event})

  const showDelete = () => pushModal(EventDeleteConfirm, {url, event})

  let ul: Element

  onMount(() => {
    ul.addEventListener("click", onClick)
  })
</script>

<ul class="menu whitespace-nowrap rounded-box bg-base-100 p-2 shadow-xl" bind:this={ul}>
  {#if isRoot}
    <li>
      <Button onclick={share}>
        <Icon size={4} icon="share-circle" />
        Share to Chat
      </Button>
    </li>
  {/if}
  <li>
    <Button onclick={showInfo}>
      <Icon size={4} icon="code-2" />
      {noun} Details
    </Button>
  </li>
  {@render customActions?.()}
  {#if event.pubkey === $pubkey}
    <li>
      <Button onclick={showDelete} class="text-error">
        <Icon size={4} icon="trash-bin-2" />
        Delete {noun}
      </Button>
    </li>
  {:else}
    <li>
      <Button class="text-error" onclick={report}>
        <Icon size={4} icon="danger" />
        Report Content
      </Button>
    </li>
  {/if}
</ul>
