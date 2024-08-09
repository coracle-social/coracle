<script lang="ts">
  import CardButton from '@lib/components/CardButton.svelte'
  import SpaceCreate from '@app/components/SpaceCreate.svelte'
  import SpaceJoin from '@app/components/SpaceJoin.svelte'
  import {pushModal} from '@app/modal'

  const startCreate = () => pushModal(SpaceCreate)

  const startJoin = () => pushModal(SpaceJoin)
</script>

<div class="column gap-4">
  <h1 class="heading">Add a Space</h1>
  <p class="text-center">Spaces are places where communities come together to work, play, and hang out.</p>
  <CardButton icon="add-circle" title="Get started" on:click={startCreate}>
    Just a few questions and you'll be on your way.
  </CardButton>
  <div class="card column gap-4">
    <h2 class="subheading">Have an invite?</h2>
    <button class="btn btn-primary" on:click={startJoin}>
      Join a Space
    </button>
  </div>
</div>
