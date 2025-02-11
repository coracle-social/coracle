<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
</script>

<FlexColumn class="mt-8">
  <h1 class="text-center text-3xl">Welcome to Nostr!</h1>
  <p>Congratulations, you're ready to go! A few tips for beginners:</p>
  <ul class="list-disc px-8">
    <li>
      Make sure you save your private key (or "nsec"). This is your password, and it can't be
      recovered!
    </li>
    <li>
      Engagement bait doesn't work here - be genuine, ask questions, and offer thoughtful comments
      to grow your following.
    </li>
    <li>
      Nostr doesn't have a trust and safety team. You're responsible for curating your own
      experience, just like on the open internet.
    </li>
  </ul>
  <p>That's it! When you’re ready, click below to go to your feed.</p>
  <Anchor href="/" button accent class="text-center">I'm ready!</Anchor>
</FlexColumn>
