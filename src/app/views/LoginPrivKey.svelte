<script lang="ts">
  import {Capacitor} from "@capacitor/core"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"

  const signerHref = Capacitor.isNativePlatform()
    ? "https://github.com/greenart7c3/Amber"
    : "https://nsec.app"
</script>

<Content size="lg" class="text-center">
  <Heading>Login with your Private Key</Heading>
  <p class="max-w-sm m-auto">
    Private key login is no longer supported. Please use
    a <Anchor external underline href={signerHref}>remote signer</Anchor> to
    securely store your nostr keys.
  </p>
</Content>
