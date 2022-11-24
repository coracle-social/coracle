<script>
  import {navigate} from 'svelte-routing'
  import {generatePrivateKey} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import toast from "src/state/toast"
  import {user} from "src/state/user"
  import {dispatch} from "src/state/dispatch"

  let privKey = ''

  const copyKey = () => {
    copyToClipboard(privKey)
    toast.show("info", "Your private key has been copied to the clipboard.")
  }

  const generateKey = () => {
    privKey = generatePrivateKey()
    toast.show("info", "Your private key has been re-generated.")
  }

  const logIn = async () => {
    if (!privKey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid private key.")
    } else {
      const {found} = await dispatch("account/init", privKey)

      await navigate(found ? `/` : '/settings/profile')
    }
  }
</script>

<div class="flex justify-center pt-12">
  <div class="flex flex-col gap-4 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Welcome!</h1>
      <i>To the Dogwood Social Network</i>
    </div>
    <div class="flex flex-col gap-4">
      <small>
        To log in to existing account, simply enter your private key. To create a new account, just
        let us generate one for you.
      </small>
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input type="password" bind:value={privKey} placeholder="Enter your private key">
          <i slot="after" class="fa-solid fa-copy" on:click={copyKey} />
        </Input>
        <Anchor on:click={generateKey} class="text-right">
          <small>Generate new key</small>
        </Anchor>
      </div>
      <small>
        Your private key is a string of random letters and numbers that allow you to prove
        you own your account. Write it down and keep it secret!
      </small>
    </div>
    <Anchor class="text-center" type="button" on:click={logIn}>Log In</Anchor>
  </div>
</div>
