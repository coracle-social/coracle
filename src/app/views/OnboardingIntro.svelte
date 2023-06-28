<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import {modal} from "src/partials/state"

  const tutorialUrl = "https://nostr.com/"
  const videoUrl = "https://dufflepud.us-southeast-1.linodeobjects.com/coracle_intro.mp4"
</script>

<Content size="lg" class="text-center">
  <Heading>Create an Account</Heading>
  <p>
    New to Nostr? Click <Anchor class="underline" external href={tutorialUrl}>here</Anchor> or watch
    the video below for a crash course on what it is, and how to use it.
  </p>
  <video controls src={videoUrl} class="object-contain object-center" />
  <p>
    When you’re ready to dive in, click below and we’ll guide you through the process of creating an
    account.
  </p>
  <Anchor
    theme="button-accent"
    on:click={() => modal.replace({type: "onboarding", stage: "profile"})}>
    Let's go!
  </Anchor>
</Content>
