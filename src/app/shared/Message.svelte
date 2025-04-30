<script lang="ts">
  import cx from "classnames"
  import {formatTimestamp} from "@welshman/lib"
  import {PublishStatus} from "@welshman/net"
  import {abortThunk, session, thunkHasStatus, thunks, type Thunk} from "@welshman/app"
  import {fly} from "svelte/transition"
  import {timestamp1} from "src/util/misc"
  import Modal from "src/partials/Modal.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import PersonBadgeMedium from "src/app/shared/PersonBadgeMedium.svelte"
  import NoteInfo from "src/app/shared/NoteInfo.svelte"
  import {ensureMessagePlaintext, userSettings} from "src/engine"

  export let message

  const getContent = e => (e.kind === 4 ? ensureMessagePlaintext(e) : e.content) || ""

  let showDetails = false

  $: thunk = $thunks[message.wrap?.id || message.id] as Thunk
</script>

<div in:fly={{y: 20}} class="grid gap-2 py-1">
  <div
    class={cx("flex max-w-xl flex-col gap-2 rounded-2xl px-4 py-2", {
      "ml-12 justify-self-end rounded-br-none bg-neutral-100 text-neutral-800":
        message.pubkey === $session.pubkey,
      "mr-12 rounded-bl-none bg-tinted-800": message.pubkey !== $session.pubkey,
    })}>
    {#if message.showProfile && message.pubkey !== $session.pubkey}
      <PersonBadgeMedium pubkey={message.pubkey} />
    {/if}
    <div class="break-words">
      {#await getContent(message)}
        <!-- pass -->
      {:then content}
        <NoteContent showEntire note={{...message, content}} />
      {/await}
    </div>
    <small
      class="mt-1 flex items-center justify-between gap-2 text-xs"
      class:text-tinted-700={message.pubkey === $session.pubkey}
      class:text-neutral-100={message.pubkey !== $session.pubkey}>
      {#if $thunk}
        {#if thunkHasStatus($thunk, PublishStatus.Pending)}
          <div class="flex items-center gap-1">
            <i class="fa fa-circle-notch fa-spin"></i>
            Sending...
            {#if message.created_at > $timestamp1 - $userSettings.send_delay / 1000}
              <button
                class="cursor-pointer py-1 text-tinted-700-d underline"
                on:click={() => abortThunk(thunk)}>Cancel</button>
            {/if}
          </div>
        {:else}
          {formatTimestamp(message.created_at)}
        {/if}
      {:else}
        {formatTimestamp(message.created_at)}
      {/if}
      <div class="flex items-center gap-3">
        <i
          class="fa fa-info-circle cursor-pointer text-neutral-400"
          on:click={() => (showDetails = true)} />
        {#if message.kind === 4}
          <Popover triggerType="mouseenter">
            <i slot="trigger" class="fa fa-unlock cursor-pointer text-neutral-400" />
            <p slot="tooltip">
              This message was sent using nostr's legacy DMs, which have a number of shortcomings.
              Read more <Anchor underline modal href="/help/nip-44-dms">here</Anchor>.
            </p>
          </Popover>
        {:else}
          <Popover triggerType="mouseenter">
            <i slot="trigger" class="fa fa-lock cursor-pointer text-neutral-400" />
            <div slot="tooltip" class="flex flex-col gap-2">
              <p>
                This message was sent using nostr's new group chat specification, which solves
                several problems with legacy DMs. Read more <Anchor
                  underline
                  modal
                  href="/help/nip-44-dms">here</Anchor
                >.
              </p>
              {#if message.pubkey === $session.pubkey}
                <p>
                  Note that these messages are not yet universally supported. Make sure the person
                  you're chatting with is using a compatible nostr client.
                </p>
              {/if}
            </div>
          </Popover>
        {/if}
      </div>
    </small>
  </div>
</div>

{#if showDetails}
  <Modal onEscape={() => (showDetails = false)}>
    <NoteInfo event={message} />
  </Modal>
{/if}
