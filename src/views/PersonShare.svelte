<script lang="ts">
  import QRCode from 'qrcode'
  import {prop} from 'ramda'
  import {nip19} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import {onMount} from 'svelte'
  import Content from 'src/partials/Content.svelte'
  import Input from 'src/partials/Input.svelte'
  import {getBestRelay} from 'src/agent/helpers'
  import {modal, toast} from 'src/app'

  const {pubkey} = $modal.person
  const relays = [prop('url', getBestRelay(pubkey))]
  const nprofile = nip19.nprofileEncode({pubkey, relays})

  let canvas

  const copyKey = () => {
    copyToClipboard(nprofile)
    toast.show("info", "Profile has been copied to the clipboard!")
  }

  onMount(() => QRCode.toCanvas(canvas, nprofile))
</script>

<Content size="lg">
  <canvas class="m-auto" bind:this={canvas} />
  <Input value={nprofile}>
    <button slot="after" class="fa fa-copy" on:click={copyKey} />
  </Input>
  <div class="text-center text-light">
    Copy or scan from a nostr app to share this profile.
  </div>
</Content>
