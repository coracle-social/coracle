<script lang="ts">
  import {nip19} from "nostr-tools"
  import {copyToClipboard} from "src/util/html"
  import {modal, appName, toast} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import {env} from "src/engine"

  export let privkey

  const nsec = nip19.nsecEncode(privkey)
  const nextStage = $env.FORCE_RELAYS.length > 0 ? "follows" : "relays"

  const copyKey = () => {
    copyToClipboard(nsec)
    toast.show("info", "Your private key has been copied to the clipboard. Keep it secret!")
  }
</script>

<Content size="lg" class="text-center">
  <Heading>Generate a Key</Heading>
  <p>
    Your private key is your password, and gives you total control over your Nostr account. We've
    generated a fresh one for you below – store it somewhere safe!
  </p>
  <div class="flex gap-2">
    <Input disabled placeholder={"•".repeat(53)} wrapperClass="flex-grow">
      <i slot="before" class="fa fa-lock" />
      <button slot="after" class="fa fa-copy cursor-pointer" on:click={copyKey} />
    </Input>
    <Anchor
      theme="button-accent"
      on:click={() => modal.replace({type: "onboarding", stage: nextStage})}>
      Got it
    </Anchor>
  </div>
  <p>If you don't want to save your keys now, you can find them later in {appName}'s settings.</p>
</Content>
