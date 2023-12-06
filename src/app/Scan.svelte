<script lang="ts">
  import QrScanner from "qr-scanner"
  import {onMount, onDestroy} from "svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"

  export let onScan

  let video
  let scanner

  const onDecode = result => onScan(result.data)

  onMount(() => {
    scanner = new Promise(resolve => {
      setTimeout(async () => {
        const scanner = new QrScanner(video, onDecode, {
          returnDetailedScanResult: true,
        })

        await scanner.start()

        resolve(scanner)
      }, 1000)
    })
  })

  onDestroy(() => {
    scanner.then(async s => {
      await s.stop()
      await s.destroy()
    })
  })
</script>

<Content>
  {#await scanner}
    <Spinner>Loading your camera...</Spinner>
  {:then}
    <span />
  {/await}
  <div
    class="m-auto rounded border border-solid border-mid bg-dark p-4"
    class:hidden={status !== "ready"}>
    <video class="m-auto rounded" bind:this={video} />
  </div>
</Content>
