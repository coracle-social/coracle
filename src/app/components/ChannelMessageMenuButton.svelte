<script lang="ts">
  import {type Instance} from "tippy.js"
  import {between} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import ChannelMessageMenu from "@app/components/ChannelMessageMenu.svelte"

  const {url, event} = $props()

  const open = () => popover?.show()

  const onClick = () => popover?.hide()

  const onMouseMove = ({clientX, clientY}: any) => {
    if (popover) {
      const {x, y, width, height} = popover.popper.getBoundingClientRect()

      if (!between([x, x + width], clientX) || !between([y, y + height + 30], clientY)) {
        popover.hide()
      }
    }
  }

  let popover: Instance | undefined = $state()
</script>

<svelte:document onmousemove={onMouseMove} />

<div class="flex">
  <Button class="btn join-item btn-xs" onclick={open}>
    <Icon icon="menu-dots" size={4} />
  </Button>
  <Tippy
    bind:popover
    component={ChannelMessageMenu}
    props={{url, event, onClick}}
    params={{trigger: "manual", interactive: true}} />
</div>
