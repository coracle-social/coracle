<script lang="ts">
  import {updateIn} from 'hurdak'
  import {slide} from 'src/util/transition'
  import Card from 'src/partials/Card.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import FlexColumn from 'src/partials/FlexColumn.svelte'
  import {session, OnboardingTask, updateCurrentSession} from "src/engine"

  const hideTask = task =>
    updateCurrentSession(updateIn('onboarding_tasks_completed', tasks => [...tasks, task]))
</script>

{#if !$session.onboarding_tasks_completed.includes(OnboardingTask.BackupKey)}
  <div class="-my-2">
    <div out:slide|local class="py-4">
      <Card class="relative">
        <FlexColumn>
          <p class="flex items-center gap-4 text-xl">
            <i class="fa fa-info-circle" /> Back up your key!
          </p>
          <p>
            Nostr accounts aren't secured with a username and password, but with a "private key".
            Your key is proof of your identity, so keep it safe!
          </p>
          <p>
            We recommend storing your key in a password manager
            like <Anchor external underline href="https://bitwarden.com/">Bitwarden</Anchor>, and
            logging in to other apps only using a signer extension
            like <Anchor external underline href="https://getalby.com/">Alby</Anchor>.
          </p>
          <p>
            You can find your keys by clicking on your profile picture, then the "Keys" menu item.
          </p>
        </FlexColumn>
        <i class="fa fa-times absolute right-0 top-0 cursor-pointer p-2" on:click={() => hideTask(OnboardingTask.BackupKey)} />
      </Card>
    </div>
  </div>
{/if}
