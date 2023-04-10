<script lang="ts">
  import QrScanner from "qr-scanner"
  import {onDestroy} from "svelte"
  import {navigate} from "svelte-routing"
  import {find} from "ramda"
  import {nip05, nip19} from "nostr-tools"
  import Heading from "src/ui/partials/Heading.svelte"
  import Input from "src/ui/partials/Input.svelte"
  import Anchor from "src/ui/partials/Anchor.svelte"
  import Spinner from "src/ui/partials/Spinner.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import {toast} from "src/app/ui"

  let video,
    value,
    scanner,
    status = ""

  const onDecode = result => {
    handleInput(result.data)
  }

  const handleInput = async input => {
    input = input.replace("nostr:", "")

    if (find(s => input.startsWith(s), ["note1", "npub1", "nevent1", "nprofile1"])) {
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
  }

  const showVideo = async () => {
    status = "loading"

    scanner = new QrScanner(video, onDecode, {
      returnDetailedScanResult: true,
    })

    await scanner.start()

    status = "ready"
  }

  onDestroy(async () => {
    if (scanner) {
      await scanner.stop()
      await scanner.destroy()
    }
  })
</script>

<Content>
  <div class="flex flex-col items-center justify-center">
    <Heading>Find Something</Heading>
    <p>
      Enter any nostr identifier (npub, nevent, nprofile, note or user@domain.tld), or click on the
      camera icon to scan with your device's camera instead.
    </p>
  </div>
  <form class="flex gap-2" on:submit|preventDefault={() => handleInput(value)}>
    <Input placeholder="nprofile1..." bind:value wrapperClass="flex-grow" />
    <Anchor type="button" on:click={() => handleInput(value)}>
      <i class="fa fa-arrow-right" />
    </Anchor>
    <Anchor type="button" on:click={showVideo}>
      <i class="fa fa-camera" />
    </Anchor>
  </form>
  {#if status === "loading"}
    <Spinner>Loading your camera...</Spinner>
  {/if}
  <video bind:this={video} />
</Content>
