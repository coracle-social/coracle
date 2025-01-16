<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Link from "@lib/components/Link.svelte"
  import Dialog from "@lib/components/Dialog.svelte"
  import CardButton from "@lib/components/CardButton.svelte"
  import LogIn from "@app/components/LogIn.svelte"
  import SignUp from "@app/components/SignUp.svelte"
  import {PLATFORM_TERMS, PLATFORM_PRIVACY, PLATFORM_NAME} from "@app/state"
  import {pushModal} from "@app/modal"

  const logIn = () => pushModal(LogIn)

  const signUp = () => pushModal(SignUp)
</script>

<Dialog>
  <div class="column gap-4">
    <div class="py-2">
      <h1 class="heading">Welcome to {PLATFORM_NAME}!</h1>
      <p class="text-center">The chat app built for self-hosted communities.</p>
    </div>
    <Button on:click={logIn}>
      <CardButton class="!btn-primary">
        <div slot="icon"><Icon icon="login-2" size={7} /></div>
        <div slot="title">Log in</div>
        <div slot="info">If you've been here before, you know the drill.</div>
      </CardButton>
    </Button>
    <Button on:click={signUp}>
      <CardButton>
        <div slot="icon"><Icon icon="add-circle" size={7} /></div>
        <div slot="title">Create an account</div>
        <div slot="info">Just a few questions and you'll be on your way.</div>
      </CardButton>
    </Button>
    <p class="text-center text-xs opacity-75">
      By using {PLATFORM_NAME}, you consent to our
      <Link external class="link" href={PLATFORM_TERMS}>Terms of Service</Link> and
      <Link external class="link" href={PLATFORM_PRIVACY}>Privacy Policy</Link>.
    </p>
  </div>
</Dialog>
