<script lang="ts">
  import {assoc} from "@welshman/lib"
  import {makeSecret, Nip46Broker} from "@welshman/signer"
  import {loadHandle, nip46Perms, updateSession} from "@welshman/app"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {showWarning} from "src/partials/Toast.svelte"
  import {OnboardingTask, loginWithNip46} from "src/engine"

  export let state
  export let setStage

  const handler = {
    domain: "nsec.app",
    relays: ["wss://relay.nsec.app/"],
    pubkey: "e24a86943d37a91ab485d6f9a7c66097c25ddd67e8bd1b75ed252a3c266cf9bb",
  }

  const prev = () => setStage("intro")

  const secret = makeSecret()
  const broker = Nip46Broker.get({secret, handler})

  const next = async () => {
    if (state.pubkey) {
      return setStage("profile")
    }

    if (state.username.length < 3) {
      return showWarning("Username is too short.")
    }

    if (!state.username.match(/^[a-z0-9]+$/)) {
      return showWarning("Please use only numbers and lowercase letters.")
    }

    loading = true

    try {
      const handle = await loadHandle(`${state.username}@${handler.domain}`)

      if (handle?.pubkey) {
        return showWarning("Sorry, it looks like that username is already taken.")
      }

      state.pubkey = await broker.createAccount(state.username, nip46Perms)

      if (!state.pubkey) {
        return showWarning("Something went wrong, please try again!")
      }

      // Now we can log in. Use the user's pubkey for the handler (legacy stuff)
      const success = await loginWithNip46("", {...handler, pubkey: state.pubkey}, secret)

      if (!success) {
        return showWarning("Something went wrong, please try again!")
      }

      updateSession(state.pubkey, assoc("onboarding_tasks_completed", [OnboardingTask.BackupKey]))
      setStage("profile")
    } finally {
      loading = false
    }
  }

  let loading = false
</script>

<div class="flex gap-3">
  <p
    class="-ml-1 -mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-lg">
    2/5
  </p>
  <p class="text-2xl font-bold">Secure your Keys</p>
</div>
<p>
  Nostr uses cryptographic key pairs instead of passwords, which puts you in full control of your
  social identity!
</p>
<p>
  Handing your keys to every app you log into can be risky though, which is why it's wise to use a <Anchor
    underline
    modal
    href="/help/remote-signers">remote signer</Anchor> to keep them for you.
</p>
<p>
  To get you started, we'll redirect you to our favorite signer for beginners:
  <Anchor external underline href="https://nsec.app">nsec.app</Anchor>. They'll ask you a couple
  questions and send you back here to set up your own profile.
</p>
<Field label="Your User Name">
  <Input
    bind:value={state.username}
    disabled={loading || state.pubkey}
    placeholder="nostrnewb27"
    class="flex-grow">
    <i slot="before" class="fa fa-user-astronaut" />
  </Input>
</Field>
<div class="flex gap-2">
  <Anchor button on:click={prev} disabled={loading}><i class="fa fa-arrow-left" /> Back</Anchor>
  <Anchor button accent class="flex-grow" {loading} on:click={next}>Continue</Anchor>
</div>
