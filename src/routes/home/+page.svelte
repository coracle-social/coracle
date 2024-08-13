<script lang="ts">
  import CardButton from "@lib/components/CardButton.svelte"
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content">
    <div class="flex max-w-2xl flex-col gap-4">
      <h1 class="text-stark-content text-center text-5xl">Welcome to</h1>
      <h1 class="text-stark-content mb-4 text-center text-5xl font-bold uppercase">Flotilla</h1>
      <div class="grid lg:grid-cols-2 gap-3">
        <CardButton icon="add-circle" title="Create a space" class="h-24">
            Invite all your friends, do life together.
        </CardButton>
        <CardButton icon="compass" title="Discover spaces" class="h-24">
            Find a community based on your hobbies or interests.
        </CardButton>
        <CardButton icon="plain" title="Leave feedback" class="h-24">
            Let us know how we can improve by giving us feedback.
        </CardButton>
        <CardButton icon="hand-pills" title="Donate to Flotilla" class="h-24">
            Support the project by donating to the developer.
        </CardButton>
      </div>
    </div>
  </div>
</div>
