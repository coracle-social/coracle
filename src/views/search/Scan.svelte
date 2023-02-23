<script lang="ts">
  import QrScanner from 'qr-scanner'
  import {onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {waitFor} from 'hurdak/lib/hurdak'
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  let mode = 'input', video, ready, value, scanner

  const onDecode = result => {
    goToEntity(result.data)
  }

  const goToEntity = entity => {
    navigate("/" + entity.replace('nostr:', ''))
  }

  const setMode = async newMode => {
    mode = newMode

    if (newMode === 'scan') {
      await waitFor(() => video)

      scanner = new QrScanner(video, onDecode, {
        returnDetailedScanResult: true,
      })

      await scanner.start()

      ready = true
    } else if (scanner) {
      ready = false
      await scanner.stop()
      await scanner.destroy()
    }
  }

  onDestroy(async () => {
    if (scanner) {
      await scanner.stop()
      await scanner.destroy()
    }
  })
</script>

{#if mode === 'input'}
<div class="flex gap-2">
  <Input placeholder="nprofile..." bind:value={value} wrapperClass="flex-grow" />
  <Anchor type="button" on:click={() => goToEntity(value)}>
    <i class="fa fa-arrow-right" />
  </Anchor>
  <Anchor type="button" on:click={() => setMode('scan')}>
    <i class="fa fa-qrcode" />
  </Anchor>
</div>
<div class="text-center text-light">
  Enter any nostr identifier (npub, nevent, nprofile or note), or click on the
  camera icon to scan with your device's camera instead.
</div>
{:else}
  {#if !ready}
  <Spinner>
    Loading your camera...
  </Spinner>
  {/if}
  <video bind:this={video} />
  {#if ready}
  <Anchor type="unstyled" class="flex gap-2 items-center" on:click={() => setMode('input')}>
    <i class="fa fa-arrow-left" />
    <span class="underline">Go back</span>
  </Anchor>
  {/if}
{/if}
