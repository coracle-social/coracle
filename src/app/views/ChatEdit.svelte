<script lang="ts">
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {toast, modal} from "src/partials/state"
  import {joinNip28Channel, publishNip28ChannelCreate, publishNip28ChannelUpdate} from "src/engine"
  import {toastProgress} from "src/app/state"

  export let channel = {name: null, id: null, about: null, picture: null}

  const submit = async e => {
    e.preventDefault()

    if (!channel.name) {
      toast.show("error", "Please enter a name for your room.")
    } else {
      const {id, ...content} = channel

      if (id) {
        const pub = await publishNip28ChannelUpdate(id, content)

        pub.on("progress", toastProgress)
      } else {
        const pub = await publishNip28ChannelCreate(content)

        joinNip28Channel(pub.event.id)
      }

      modal.pop()
    }
  }
</script>

<form on:submit={submit} class="flex justify-center py-12">
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <h1 class="staatliches text-6xl">Name your room</h1>
    </div>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <strong>Room name</strong>
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={channel.name}>
          <i slot="before" class="fa-solid fa-tag" />
        </Input>
        <p class="text-sm text-gray-1">The room's name can be changed anytime.</p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Room information</strong>
        <Textarea name="about" bind:value={channel.about} />
        <p class="text-sm text-gray-1">
          Give people an idea of what kind of conversations will be happening here.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Picture</strong>
        <ImageInput icon="image" bind:value={channel.picture} />
        <p class="text-sm text-gray-1">A picture to help people remember your room.</p>
      </div>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Done</Anchor>
    </div>
  </Content>
</form>
