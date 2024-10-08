<script lang="ts">
  import {type Instance} from "tippy.js"
  import type {NativeEmoji} from "emoji-picker-element/shared"
  import {ctx, uniq, between} from "@welshman/lib"
  import {Nip59} from "@welshman/signer"
  import type {TrustedEvent} from "@welshman/util"
  import {makeThunk, signer, publishThunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import EmojiPicker from "@lib/components/EmojiPicker.svelte"
  import {makeReaction} from "@app/commands"

  export let event: TrustedEvent
  export let pubkeys: string[]

  const open = () => popover.show()

  const onClick = async (emoji: NativeEmoji) => {
    const template = makeReaction({event, content: emoji.unicode})
    const nip59 = Nip59.fromSigner($signer!)

    for (const recipient of uniq(pubkeys)) {
      const rumor = await nip59.wrap(recipient, template)

      publishThunk(
        makeThunk({
          event: rumor.wrap,
          relays: ctx.app.router.PublishMessage(recipient).getUrls(),
        }),
      )
    }

    popover.hide()
  }

  const onMouseMove = ({clientX, clientY}: any) => {
    const {x, y, width, height} = popover.popper.getBoundingClientRect()

    if (!between([x, x + width], clientX) || !between([y, y + height + 30], clientY)) {
      popover.hide()
    }
  }

  let popover: Instance
</script>

<svelte:document on:mousemove={onMouseMove} />

<div class="flex">
  <Button class="btn join-item btn-xs" on:click={open}>
    <Icon icon="smile-circle" size={4} />
  </Button>
  <Tippy
    bind:popover
    component={EmojiPicker}
    props={{onClick}}
    params={{
      trigger: "manual",
      interactive: true,
    }} />
</div>
