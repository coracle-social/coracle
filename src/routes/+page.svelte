<script lang="ts">
  import Icon from "@lib/components/Icon.svelte"
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content">
    <div class="flex max-w-xl flex-col gap-4">
      <h1 class="text-stark-content text-center text-5xl">Welcome to</h1>
      <h1 class="text-stark-content mb-4 text-center text-5xl font-bold uppercase">Flotilla</h1>
      <div class="grid grid-cols-2 gap-3">
        <div class="button flex items-center gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="add-circle" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Create a group</p>
            <p class="text-xs">Invite all your friends, do life together.</p>
            <p></p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button flex items-center gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="compass" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Discover groups</p>
            <p class="text-xs">Find a community based on your hobbies or interests.</p>
            <p></p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button flex items-center gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="plain" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Leave feedback</p>
            <p class="text-xs">Let us know how we can improve by giving us feedback.</p>
            <p></p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
        <div class="button flex items-center gap-4 bg-base-100 hover:bg-base-200">
          <Icon class="bg-accent" size={7} icon="hand-pills" />
          <div class="flex flex-col gap-1">
            <p class="text-stark-content">Donate to Flotilla</p>
            <p class="text-xs">Support the project by donating to the developer.</p>
            <p></p>
          </div>
          <Icon size={7} icon="alt-arrow-right" />
        </div>
      </div>
    </div>
  </div>
</div>
