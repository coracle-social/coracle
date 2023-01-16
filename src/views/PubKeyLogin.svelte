<script>
  import {nip19} from 'nostr-tools'
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {toast, login} from "src/app"

  let npub = ''

  const logIn = async () => {
    const pubkey = npub.startsWith('npub') ? nip19.decode(npub).data : npub

    if (!pubkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid public key.")
    } else {
      await login({pubkey})
    }
  }
</script>


<div class="flex flex-col gap-8 text-white p-12">
  <h1 class="staatliches text-4xl text-center">Login with your Public Key</h1>
  <p>
    For read-only access, enter your public key (or someone else's) below. Your
    key should start with "npub".
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input bind:value={npub} placeholder="npub...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor type="button" on:click={logIn}>Log In</Anchor>
  </div>
</div>

