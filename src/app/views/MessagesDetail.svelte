<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {toHex} from "src/util/nostr"
  import {now, formatTimestamp} from "src/util/misc"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {getAllPubkeyRelays, sampleRelays} from "src/agent/relays"
  import {watch} from "src/agent/db"
  import network from "src/agent/network"
  import {keys, directory, cmd, chat} from "src/system"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"

  export let entity

  const id = toHex(entity)
  const crypt = keys.getCrypt()
  const pubkey = toHex(entity)
  const profile = watch(directory.profiles, () => directory.getProfile(pubkey))

  chat.setLastChecked(pubkey, now())

  const getRelays = () => sampleRelays(getAllPubkeyRelays([pubkey, keys.getPubkey()]))

  const sendMessage = async content => {
    const cyphertext = await crypt.encrypt(pubkey, content)
    const [event] = await cmd.createDirectMessage(pubkey, cyphertext).publish(getRelays())

    // Return unencrypted content so we can display it immediately
    return {...event, content}
  }

  onMount(() => {
    const sub = network.listen({
      relays: getRelays(),
      filter: [
        {kinds: [4], authors: [keys.getPubkey()], "#p": [pubkey]},
        {kinds: [4], authors: [pubkey], "#p": [keys.getPubkey()]},
      ],
    })

    return () => {
      sub.then(s => s.unsub())
    }
  })

  document.title = `DMs with ${directory.displayProfile($profile)}`
</script>

<Channel {id} {sendMessage}>
  <div slot="header" class="mb-2 flex h-20 items-start gap-4 overflow-hidden p-4">
    <div class="flex items-center gap-4">
      <Anchor
        type="unstyled"
        class="fa fa-arrow-left cursor-pointer text-2xl"
        on:click={() => history.back()} />
      <PersonCircle {pubkey} size={12} />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <Anchor href={routes.person(pubkey)} class="text-lg font-bold">
            {directory.displayProfile($profile)}
          </Anchor>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock text-gray-1" />
          <span class="text-gray-1">Encrypted</span>
        </div>
      </div>
      <PersonAbout truncate {pubkey} />
    </div>
  </div>
  <div
    slot="message"
    let:message
    class={cx("flex overflow-hidden text-ellipsis", {
      "ml-12 justify-end": message.profile.pubkey === keys.getPubkey(),
      "mr-12": message.profile.pubkey !== keys.getPubkey(),
    })}>
    <div
      class={cx("inline-block max-w-xl rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-end text-gray-8":
          message.profile.pubkey === keys.getPubkey(),
        "rounded-bl-none bg-gray-7": message.profile.pubkey !== keys.getPubkey(),
      })}>
      <div class="break-words">
        {#if typeof message.content === "string"}
          <NoteContent showEntire note={message} />
        {/if}
      </div>
      <small
        class="mt-1"
        class:text-gray-7={message.profile.pubkey === keys.getPubkey()}
        class:text-gray-1={message.profile.pubkey !== keys.getPubkey()}>
        {formatTimestamp(message.created_at)}
      </small>
    </div>
  </div>
</Channel>
