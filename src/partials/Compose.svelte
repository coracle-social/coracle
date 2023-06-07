<script lang="ts">
  import {nip19} from "nostr-tools"
  import {last, partition, pluck, propEq} from "ramda"
  import {displayPerson} from "src/util/nostr"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import ContentEditable from "src/partials/ContentEditable.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"
  import {searchPeople} from "src/agent/db"
  import user from "src/agent/user"
  import {getPubkeyWriteRelays} from "src/agent/relays"

  export let onSubmit

  let contenteditable, suggestions

  const {petnamePubkeys} = user

  const pubkeyEncoder = {
    encode: pubkey => {
      const relays = pluck("url", getPubkeyWriteRelays(pubkey))
      const nprofile = nip19.nprofileEncode({pubkey, relays})

      return "nostr:" + nprofile
    },
    decode: link => {
      // @ts-ignore
      return nip19.decode(last(link.split(":"))).data.pubkey
    },
  }

  const applySearch = word => {
    let results = []
    if (word.startsWith("@")) {
      const [followed, notFollowed] = partition(
        p => $petnamePubkeys.includes(p.pubkey),
        $searchPeople(word.slice(1))
      )

      results = followed.concat(notFollowed)
    }

    suggestions.setData(results.slice(0, 5))
  }

  const getInfo = () => {
    const selection = window.getSelection()
    const {focusNode: node, focusOffset: offset} = selection
    const textBeforeCursor = node.textContent.slice(0, offset)
    const word = last(textBeforeCursor.trim().split(/\s+/))

    return {selection, node, offset, word}
  }

  const autocomplete = ({person = null, force = false} = {}) => {
    let completed = false

    const {selection, node, offset, word} = getInfo()

    const annotate = (prefix, text, value) => {
      const adjustedOffset = offset - word.length + prefix.length

      // Space includes a zero-width space to avoid having the cursor end up inside
      // mention span on backspace, and a space for convenience in composition.
      const space = document.createTextNode("\u200B\u00A0")
      const span = document.createElement("span")

      span.classList.add("underline")
      span.dataset.coracle = JSON.stringify({prefix, value})
      span.innerText = text

      // Remove our partial mention text
      selection.setBaseAndExtent(node, adjustedOffset, node, offset)
      selection.deleteFromDocument()

      // Add the span and space
      selection.getRangeAt(0).insertNode(span)
      selection.collapse(span.nextSibling, 0)
      selection.getRangeAt(0).insertNode(space)
      selection.collapse(space, 2)

      completed = true
    }

    // Mentions
    if ((force || word.length > 1) && word.startsWith("@") && person) {
      annotate("@", displayPerson(person).trim(), pubkeyEncoder.encode(person.pubkey))
    }

    // Topics
    if ((force || word.length > 1) && word.startsWith("#")) {
      annotate("#", word.slice(1), word.slice(1))
    }

    suggestions.setData([])

    return completed
  }

  const onKeyDown = e => {
    if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
      return onSubmit()
    }

    // Don't close a modal, submit the form, or lose focus
    if (["Escape", "Tab"].includes(e.code)) {
      e.preventDefault()
      e.stopPropagation()
    }

    // If we have suggestions, re-route keyboard commands
    if (suggestions.get() && ["Enter", "ArrowUp", "ArrowDown"].includes(e.code)) {
      e.preventDefault()
    }

    // Enter adds a newline, so do it on key down
    if (["Enter"].includes(e.code)) {
      autocomplete({person: suggestions.get()})
    }

    // Only autocomplete topics on space
    if (["Space"].includes(e.code)) {
      if (autocomplete()) {
        e.preventDefault()
      }
    }
  }

  const onKeyUp = e => {
    const {word} = getInfo()

    // Populate search data
    applySearch(word)

    if (["Tab"].includes(e.code)) {
      autocomplete({person: suggestions.get()})
    }

    if (["Escape", "Space"].includes(e.code)) {
      suggestions.clear()
    }

    if (e.code === "ArrowUp") {
      suggestions.prev()
    }

    if (e.code === "ArrowDown") {
      suggestions.next()
    }
  }

  export const mention = person => {
    const input = contenteditable.getInput()
    const selection = window.getSelection()
    const textNode = document.createTextNode("@")
    const spaceNode = document.createTextNode(" ")

    // Insert the text node, then an extra node so we don't break stuff in annotate
    selection.getRangeAt(0).insertNode(textNode)
    selection.collapse(input, 1)
    selection.getRangeAt(0).insertNode(spaceNode)
    selection.collapse(input, 1)

    autocomplete({person, force: true})
  }

  const createNewLines = (n = 1) => {
    const div = document.createElement("div")

    div.innerHTML = "<br>".repeat(n)

    return div
  }

  export const nevent = text => {
    const input = contenteditable.getInput()
    const selection = window.getSelection()
    const textNode = document.createTextNode(text)
    const newLines = createNewLines(2)

    selection.getRangeAt(0).insertNode(newLines)
    selection.collapse(input, 1)
    selection.getRangeAt(0).insertNode(textNode)
    selection.collapse(input, 0)
  }

  export const write = text => {
    const selection = window.getSelection()
    const textNode = document.createTextNode(text)

    selection.getRangeAt(0).insertNode(textNode)
    selection.collapse(textNode, text.length)

    autocomplete()
  }

  export const newlines = n => {
    const selection = window.getSelection()
    const newLines = createNewLines(2)

    selection.getRangeAt(0).insertNode(newLines)
    selection.collapse(newLines, 2)
  }

  export const parse = () => {
    let {content, annotations} = contenteditable.parse()

    // Remove zero-width and non-breaking spaces
    content = content.replace(/[\u200B\u00A0]/g, " ").trim()

    // Strip the @ sign in mentions
    annotations.filter(propEq("prefix", "@")).forEach(({value}, index) => {
      content = content.replace("@" + value, value)
    })

    return content
  }
</script>

<div class="flex">
  <ContentEditable bind:this={contenteditable} on:keydown={onKeyDown} on:keyup={onKeyUp} />
  <slot name="addon" />
</div>

<Suggestions bind:this={suggestions} select={person => autocomplete({person})}>
  <div slot="item" let:item>
    <PersonBadge inert person={item} />
  </div>
</Suggestions>
