<script lang="ts">
  import {Capacitor} from '@capacitor/core'
  import {assoc} from "@welshman/lib"
  import {makeSecret, Nip46Broker} from '@welshman/signer'
  import {nip46Perms, updateSession} from "@welshman/app"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {showWarning} from 'src/partials/Toast.svelte'
  import {OnboardingTask, loginWithNip46} from 'src/engine'

  export let setStage

  const handler = {
    domain: "nsec.app",
    relays: ["wss://relay.nsec.app"],
    pubkey: "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb",
  }

  const prev = () => setStage("intro")

  const broker = Nip46Broker.get({secret: makeSecret(), handler})

  const next = async () => {
    if (username.length < 3) {
      return showWarning("Username is too short.")
    }

    if (!username.match(/^[a-z0-9]+$/)) {
      return showWarning("Please use only numbers and lowercase letters.")
    }

    loading = true

    try {
      const pubkey = await broker.createAccount(username, nip46Perms)

      if (!pubkey) {
        return showWarning("Something went wrong, please try again!")
      }

      // Now we can log in. Use the user's pubkey for the handler (legacy stuff)
      const success = await loginWithNip46("", {...handler, pubkey})

      if (!success) {
        return showWarning("Something went wrong, please try again!")
      }

      updateSession(pubkey, assoc("onboarding_tasks_completed", [OnboardingTask.BackupKey]))
      setStage("follows")
    } finally {
      loading = false
    }
  }

  let loading = false
  let username = ""
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    2/4
  </p>
  <p class="text-2xl font-bold">Secure your Keys</p>
</div>
<p>
  Keep your account secure by using a remote signer to store your keys.
  We recommend getting started with <Anchor external underline href="https://nsec.app">nsec.app</Anchor>.
</p>
<p>
  Enter a username below and click "continue". You'll be redirected to nsec.app and asked to choose a password.
</p>
<p>
  If you'd like to hold your own keys instead, try using
  {#if Capacitor.isNativePlatform()}
    <Anchor external underline href="https://github.com/greenart7c3/Amber">a signer app</Anchor>.
  {:else}
    <Anchor external underline href="https://guides.getalby.com/user-guide/alby-account-and-browser-extension/alby-browser-extension/features/nostr">a signer extension</Anchor>.
  {/if}
</p>
<div class="flex gap-2">
  <Input bind:value={username} placeholder="Username" class="flex-grow">
    <i slot="before" class="fa fa-user-astronaut" />
  </Input>
  <p>@nsec.app</p>
</div>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow" {loading} on:click={next}>Continue</Anchor>
</div>
