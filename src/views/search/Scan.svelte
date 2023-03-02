<script lang="ts">
  import QrScanner from 'qr-scanner'
  import {onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {waitFor} from 'hurdak/lib/hurdak'
  import {any, flip, startsWith} from 'ramda'
  import {nip05, nip19} from 'nostr-tools'
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import {toast} from "src/app/ui"

  let mode = 'input', video, ready, value, scanner

  const onDecode = result => {
    handleInput(result.data)
  }

  const handleInput = async input => {
    input = input.replace('nostr:', '')

    if (any(flip(startsWith)(input), ["note1", "npub1", "nevent1", "nprofile1"])) {
      navigate("/" + input)
      return
    }

    if (input.match(/^[a-f0-9]{64}$/)) {
      navigate("/" + nip19.npubEncode(input))
      return
    }

    let profile = await nip05.queryProfile(input)
    if (profile) {
      navigate("/" + nip19.nprofileEncode(profile))
      return
    }

    toast.show("warning", "That isn't a valid nostr identifier")
    return
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
<form class="flex gap-2" on:submit|preventDefault={() => handleInput(value)}>
  <Input placeholder="nprofile..." bind:value={value} wrapperClass="flex-grow" />
  <Anchor type="button" on:click={() => handleInput(value)}>
    <i class="fa fa-arrow-right" />
  </Anchor>
  <Anchor type="button" on:click={() => setMode('scan')}>
    <i class="fa fa-qrcode" />
  </Anchor>
</form>
<div class="text-center text-light">
  Enter any nostr identifier (npub, nevent, nprofile, note or user@domain.tld), or click on the
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
