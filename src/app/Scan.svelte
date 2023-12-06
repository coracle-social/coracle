<script lang="ts">
  import QrScanner from "qr-scanner"
  import {onDestroy, createEventDispatcher} from "svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"

  export let isOpen

  let video
  let scanner

  const dispatch = createEventDispatcher()

  const onDecode = result => {
    dispatch('scan', result.data)
  }

  const start = () => {
    setTimeout(async () => {
      const s = new QrScanner(video, onDecode, {
        returnDetailedScanResult: true,
      })

      await s.start()

      scanner = s

      if (!isOpen) {
        stop()
      }
    }, 1000)
  }

  const stop = async () => {
    if (scanner) {
      const s = await scanner

      await s.stop()
      await s.destroy()
    }
  }

  $: {
    if (!isOpen) {
      stop()
    }
  }

  onDestroy(stop)
</script>

{#if isOpen}
  <Modal onEscape={stop}>
    <Content>
      {#if !scanner}
        <Spinner>Loading your camera...</Spinner>
      {/if}
      <div
        class="m-auto rounded border border-solid border-mid bg-dark p-4"
        class:hidden={status !== "ready"}>
        <video class="m-auto rounded" bind:this={video} />
      </div>
    </Content>
  </Modal>
{/if}
