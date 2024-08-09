<script lang="ts">
  import Link from '@lib/components/Link.svelte'
  import Icon from '@lib/components/Icon.svelte'
  import Button from "@lib/components/Button.svelte"
  import {clip} from '@app/toast'
</script>

<div class="column gap-4">
  <div class="py-2">
    <h1 class="heading">What is Nostr?</h1>
  </div>
  <p>
    <Link external href="https://nostr.com/">Nostr</Link> is way to build social apps that talk to eachother.
    Users own their social identity instead of renting it from a tech company, and can bring it with them from
    app to app.
  </p>
  <p>
    This can be a little confusing when you're just getting started, but as long as you're using Flotilla, it
    will work just like a normal app. When you're ready to start exploring nostr, visit your settings page to
    learn more.
  </p>
  <Button class="btn btn-primary" on:click={() => history.back()}>
    Got it
  </Button>
</div>
