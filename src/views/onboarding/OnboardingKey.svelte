<script lang="ts">
  import {nip19} from "nostr-tools"
  import {copyToClipboard} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import {modal, toast} from "src/app/ui"

  export let privkey

  const nsec = nip19.nsecEncode(privkey)
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

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
    <Anchor type="button-accent" on:click={() => modal.set({type: "onboarding", stage: "relays"})}>
      Log in
    </Anchor>
  </div>
  <p>
    Avoid pasting your key into too many apps and websites. Instead, use a <Anchor
      href={nip07}
      external>compatible browser extension</Anchor> to securely store your key.
  </p>
</Content>
