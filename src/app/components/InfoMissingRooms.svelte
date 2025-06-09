<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import {PLATFORM_NAME} from "@app/state"
</script>

<div class="column gap-4">
  <ModalHeader>
    {#snippet title()}
      <div>Where did my rooms go?</div>
    {/snippet}
  </ModalHeader>
  <p>
    You might have noticed that old rooms have disappeared from navigation. {PLATFORM_NAME} is still
    under heavy development, which means that we occasionally have to make breaking changes. In this
    case, we've changed how rooms work in {PLATFORM_NAME} to be more fully compatible with other NIP
    29 clients, like <Link external class="link" href="https://chachi.chat">Chachi</Link> and
    <Link external class="link" href="https://0xchat.com">0xChat</Link>.
  </p>
  <p>
    If you run a relay, please upgrade to a version that supports NIP 29. {PLATFORM_NAME} works best
    with the latest version of <Link
      external
      class="link"
      href="https://github.com/coracle-social/frith">Frith</Link
    >, which will automatically migrate your rooms. In the meantime, your messages are all still
    available under the "Chat" tab (all conversations have been temporarily merged together).
  </p>
  <Button class="btn btn-primary" onclick={() => history.back()}>Got it</Button>
</div>
