<script lang="ts">
  import CardButton from '@lib/components/CardButton.svelte'
  import LogIn from '@app/components/LogIn.svelte'
  import SignUp from '@app/components/SignUp.svelte'
  import {pushModal} from '@app/modal'

  const logIn = () => pushModal(LogIn)

  const signUp = () => pushModal(SignUp)
</script>

<div class="column gap-4">
  <div class="py-2">
    <h1 class="heading">Welcome to Flotilla!</h1>
    <p class="text-center">The chat app built for sovereign communities.</p>
  </div>
  <CardButton icon="login-2" title="Log in" on:click={logIn}>
    If you've been here before, you know the drill.
  </CardButton>
  <CardButton icon="add-circle" title="Create an account" on:click={signUp}>
    Just a few questions and you'll be on your way.
  </CardButton>
</div>
