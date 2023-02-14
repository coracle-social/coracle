<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {error} from "src/util/logger"
  import {stripExifData} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Button from "src/partials/Button.svelte"
  import {getUserRelays} from 'src/agent/helpers'
  import database from 'src/agent/database'
  import cmd from "src/agent/cmd"
  import {toast, modal} from "src/app"

  export let room = {name: null, id: null, about: null, picture: null}

  onMount(async () => {
    document.querySelector('[name=picture]').addEventListener('change', async e => {
      const target = e.target as HTMLInputElement
      const [file] = target.files

      if (file) {
        const reader = new FileReader()
        reader.onerror = error
        reader.onload = () => room.picture = reader.result
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
      const [event] = room.id
        ? cmd.updateRoom(getUserRelays('write'), room)
        : cmd.createRoom(getUserRelays('write'), room)

      await database.rooms.patch({id: room.id || event.id, joined: true})

      toast.show("info", `Your room has been ${room.id ? 'updated' : 'created'}!`)

      modal.set(null)
    }
  }
</script>

<form on:submit={submit} class="flex justify-center py-12" in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Name your room</h1>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Room name</strong>
        <Input type="text" name="name" wrapperClass="flex-grow" bind:value={room.name}>
          <i slot="before" class="fa-solid fa-tag" />
        </Input>
        <p class="text-sm text-light">
          The room's name can be changed anytime.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Room information</strong>
        <Textarea name="about" bind:value={room.about} />
        <p class="text-sm text-light">
          Give people an idea of what kind of conversations will be happening here.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Picture</strong>
        <input type="file" name="picture" />
        <p class="text-sm text-light">
          A picture to help people remember your room.
        </p>
      </div>
      <Button type="submit" class="text-center">Done</Button>
    </div>
  </Content>
</form>

