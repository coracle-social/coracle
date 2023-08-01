<script lang="ts">
  import QrScanner from "qr-scanner"
  import {onDestroy} from "svelte"
  import Modal from "src/partials/Modal.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"

  export let onScan

  let video
  let scanner
  let status = "closed"

  const onDecode = result => {
    onScan(result.data)
  }

  export const start = () => {
    status = "loading"

    scanner = new Promise(resolve => {
      setTimeout(async () => {
        const scanner = new QrScanner(video, onDecode, {
          returnDetailedScanResult: true,
        })

        await scanner.start()

        if (status === "closed") {
          stop()
        } else {
          resolve(scanner)

          status = "ready"
        }
      }, 1000)
    })
  }

  export const stop = async () => {
    status = "closed"

    if (scanner) {
      const s = await scanner

      await s.stop()
      await s.destroy()
    }
  }

  onDestroy(stop)
</script>

{#if status !== "closed"}
  <Modal onEscape={stop}>
    <Content>
      {#if status === "loading"}
        <Spinner>Loading your camera...</Spinner>
      {/if}
      <div
        class="m-auto rounded border border-solid border-gray-6 bg-gray-8 p-4"
        class:hidden={status !== "ready"}>
        <video class="m-auto rounded" bind:this={video} />
      </div>
    </Content>
  </Modal>
{/if}
