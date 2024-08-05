<script lang="ts">
  import Icon from 'lib/components/Icon.svelte'
</script>

<div class="hero bg-base-200 min-h-screen">
  <div class="hero-content">
    <div class="max-w-xl flex flex-col gap-4">
      <h1 class="text-5xl text-center text-stark-content">Welcome to</h1>
      <h1 class="text-5xl font-bold uppercase text-center mb-4 text-stark-content">Flotilla</h1>
      <div class="grid gap-3 grid-cols-2">
        <div class="button items-center flex gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="add-circle" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Create a group</p>
            <p class="text-xs">Invite all your friends, do life together.<p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button items-center flex gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="compass" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Discover groups</p>
            <p class="text-xs">Find a community based on your hobbies or interests.<p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button items-center flex gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="plain" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Leave feedback</p>
            <p class="text-xs">Let us know how we can improve by giving us feedback.<p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button items-center flex gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="hand-pills" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Donate to Flotilla</p>
            <p class="text-xs">Support the project by donating to the developer.<p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
      </div>
    </div>
  </div>
</div>
