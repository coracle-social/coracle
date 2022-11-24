<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import pick from "ramda/src/pick"
  import {stripExifData} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Select from "src/partials/Select.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Button from "src/partials/Button.svelte"
  import RoomList from "src/partials/chat/RoomList.svelte"
  import {user} from "src/state/user"
  import {rooms} from "src/state/app"
  import {dispatch} from "src/state/dispatch"
  import toast from "src/state/toast"

  export let room

  let values = $rooms[room] || {}

  onMount(async () => {
    document.querySelector('[name=picture]').addEventListener('change', async e => {
      const [file] = e.target.files

      if (file) {
        const reader = new FileReader()
        reader.onload = () => values.picture = reader.result
        reader.onerror = e => console.error(e)
        reader.readAsDataURL(await stripExifData(file))
      } else {
        values.picture = null
      }
    })
  })

  const submit = async e => {
    e.preventDefault()

    if (!values.name.match(/^\w[\w\-]+\w$/)) {
      toast.show("error", "Names must be comprised of letters, numbers, and dashes only.")
    } else {
      const event = await dispatch(values.id ? "room/update" : "room/create", values)

      toast.show("info", `Your room has been ${values.id ? 'updated' : 'created'}!`)

      navigate(`/chat/${room}`)
    }
  }
</script>

<div class="flex gap-4 h-full">
  <div class="sm:ml-56 w-full">
    <form on:submit={submit} class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
      <div class="flex flex-col gap-4 max-w-2xl">
        <div class="flex justify-center items-center flex-col mb-4">
          <h1 class="staatliches text-6xl">Name your room</h1>
        </div>
        <div class="flex flex-col gap-8 w-full">
          <div class="flex flex-col gap-1">
            <strong>Room name</strong>
            <Input type="text" name="name" wrapperClass="flex-grow" bind:value={values.name}>
              <i slot="before" class="fa-solid fa-tag" />
            </Input>
            <p class="text-sm text-light">
              The room's name can be changed anytime.
            </p>
          </div>
          <div class="flex flex-col gap-1">
            <strong>Room information</strong>
            <Textarea name="about" bind:value={values.about} />
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
      </div>
    </form>
  </div>
  <RoomList />
</div>

