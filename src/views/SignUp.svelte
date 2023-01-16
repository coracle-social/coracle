<script>
  import {nip19, generatePrivateKey} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Input from 'src/partials/Input.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import {toast, login} from "src/app"

  const nsec = nip19.nsecEncode(generatePrivateKey())
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const logIn = async () => {
    await login({privkey: nip19.decode(nsec).data})
  }

  const copyKey = () => {
    copyToClipboard(nsec)
    toast.show("info", "Your private key has been copied to the clipboard.")
  }
</script>


<div class="flex flex-col gap-8 text-white p-12">
  <h1 class="staatliches text-4xl text-center">Create an Account</h1>
  <p>
    Don't have a nostr account? We've created a brand new private key for you below.
    Make sure to click to copy and store it somewhere safe - this is your account's password!
  </p>
  <div class="flex gap-2">
    <div class="flex-grow">
      <Input disabled placeholder={"•".repeat(63)}>
        <i slot="before" class="fa fa-key" />
        <i slot="after" class="cursor-pointer fa fa-copy" on:click={copyKey} />
      </Input>
    </div>
    <Anchor type="button" on:click={logIn}>Log In</Anchor>
  </div>
  <p class="bg-black rounded border-2 border-solid border-warning py-3 px-6">
    Note that sharing your private key directly is not recommended, instead you should use
    a <Anchor href={nip07} external>compatible browser extension</Anchor> to securely store your key.
  </p>
</div>

