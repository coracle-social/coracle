<script lang="ts">
  import {nip19} from "nostr-tools"
  import {copyToClipboard} from "src/util/html"
  import {appName, toast} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {env} from "src/engine"

  export let privkey
  export let setStage

  const nsec = nip19.nsecEncode(privkey)
  const prev = () => setStage("profile")
  const next = () => setStage($env.FORCE_GROUP ? "follows" : "relays")

  const copyKey = () => {
    copyToClipboard(nsec)
    toast.show("info", "Your private key has been copied to the clipboard. Keep it secret!")
  }
</script>

<Heading class="text-center">Generate a Key</Heading>
<p>
  Your private key is your password, and gives you total control over your Nostr account. We've
  generated a fresh one for you below – store it somewhere safe!
</p>
<Input disabled placeholder={"•".repeat(53)} wrapperClass="flex-grow">
  <i slot="before" class="fa fa-lock" />
  <button slot="after" class="fa fa-copy cursor-pointer" on:click={copyKey} />
</Input>
<p>If you don't want to save your keys now, you can find them later in {appName}'s settings.</p>
<div class="flex gap-2">
  <Anchor button on:click={prev}><i class="fa fa-arrow-left" /></Anchor>
  <Anchor button accent class="flex-grow" on:click={next}>Got it</Anchor>
</div>
