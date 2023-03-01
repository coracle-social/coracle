<script lang="ts">
  import {toHex} from 'src/util/nostr'
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Content from 'src/partials/Content.svelte'
  import Heading from 'src/partials/Heading.svelte'
  import {toast} from "src/app/ui"
  import {login} from "src/app"

  let nsec = ''
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const logIn = () => {
    const privkey = nsec.startsWith('nsec') ? toHex(nsec) : nsec

    if (!privkey?.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid private key.")
    } else {
      login('privkey', privkey)
    }
  }
</script>


<Content size="lg" class="text-center">
  <Heading>Login with your Private Key</Heading>
  <p>
    To give Coracle full access to your nostr identity, enter your private key below.
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input type="password" bind:value={nsec} placeholder="nsec...">
        <i slot="before" class="fa fa-key" />
      </Input>
    </div>
    <Anchor type="button" on:click={logIn}>Log In</Anchor>
  </div>
  <p class="bg-black rounded border-2 border-solid border-warning py-3 px-6">
    Note that sharing your private key directly is not recommended, instead you should use
    a <Anchor href={nip07} external>compatible browser extension</Anchor> to securely store your key.
  </p>
</Content>

