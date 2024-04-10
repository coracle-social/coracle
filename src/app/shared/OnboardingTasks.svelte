<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import OnboardingTaskComponent from "src/app/shared/OnboardingTask.svelte"
  import {OnboardingTask} from "src/engine"
</script>

<OnboardingTaskComponent task={OnboardingTask.BackupKey}>
  <p class="flex items-center gap-4 text-xl staatliches">
    <i class="fa fa-key" /> Back up your key
  </p>
  <p>
    Nostr accounts aren't secured with a username and password, but with a "private key".
    Your key is proof of your identity, so keep it safe!
  </p>
  <p>
    We recommend storing your key in a password manager like <Anchor
      external
      underline
      href="https://bitwarden.com/">Bitwarden</Anchor
    >, and logging in to other apps only using a signer extension like <Anchor
      external
      underline
      href="https://getalby.com/">Alby</Anchor
    >.
  </p>
  <p>
    You can find your keys by clicking on your profile picture, then the "Keys" menu item.
  </p>
</OnboardingTaskComponent>

<OnboardingTaskComponent task={OnboardingTask.SetupWallet}>
  <p class="flex items-center gap-4 text-xl staatliches">
    <i class="fa fa-bolt" /> Get paid
  </p>
  <p>
    On nostr, you can get paid for your posts! Set up a bitcoin wallet with lightning
    support to start letting people tip you.
  </p>
  <p>
    If you used <Anchor
      external
      underline
      href="https://getalby.com/">Alby</Anchor
    > to store your keys, they're also a great option for holding your bitcoin.
  </p>
  <p>
   Copy
      your <Anchor external underline href="https://getalby.com/lightning_addresses/hodlbod/edit">
        lightning address</Anchor> into your profile settings (click "Edit" in the menu on your profile page) and you're good to go!
  </p>
</OnboardingTaskComponent>
