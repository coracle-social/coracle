<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {error} from "src/util/logger"
  import {stripExifData} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Button from "src/partials/Button.svelte"
  import {toast, modal} from "src/partials/state"
  import {getUserWriteRelays} from "src/agent/relays"
  import {rooms} from "src/agent/db"
  import cmd from "src/agent/cmd"
  import {publishWithToast} from "src/app/state"

  export let room = {name: null, id: null, about: null, picture: null}

  onMount(async () => {
    document.querySelector("[name=picture]").addEventListener("change", async e => {
      const target = e.target as HTMLInputElement
      const [file] = target.files

      if (file) {
        const reader = new FileReader()
        reader.onerror = error
        reader.onload = () => (room.picture = reader.result)
        reader.readAsDataURL(await stripExifData(file))
      } else {
        room.picture = null
      }
    })
  })

  const submit = async e => {
    e.preventDefault()

    if (!room.name) {
      toast.show("error", "Please enter a name for your room.")
    } else {
      const relays = getUserWriteRelays()

      if (room.id) {
        publishWithToast(relays, cmd.updateRoom(room))
      } else {
        const [event] = await publishWithToast(relays, cmd.createRoom(room))

        // Auto join the room the user just created
        rooms.patch({id: event.id, joined: true})
      }

      modal.set(null)
    }
  }
</script>

<form on:submit={submit} class="flex justify-center py-12" in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <h1 class="staatliches text-6xl">Name your room</h1>
    </div>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <strong>Room name</strong>
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={room.name}>
          <i slot="before" class="fa-solid fa-tag" />
        </Input>
        <p class="text-sm text-gray-1">The room's name can be changed anytime.</p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Room information</strong>
        <Textarea name="about" bind:value={room.about} />
        <p class="text-sm text-gray-1">
          Give people an idea of what kind of conversations will be happening here.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Picture</strong>
        <input type="file" name="picture" />
        <p class="text-sm text-gray-1">A picture to help people remember your room.</p>
      </div>
      <Button type="submit" class="text-center">Done</Button>
    </div>
  </Content>
</form>
