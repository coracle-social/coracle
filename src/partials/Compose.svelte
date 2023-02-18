<script lang="ts">
  import {prop, reject, sortBy, last} from 'ramda'
  import {onMount} from 'svelte'
  import {ensurePlural} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import {fromParentOffset} from "src/util/html"
  import Badge from "src/partials/Badge.svelte"
  import database from "src/agent/database"

  export let onSubmit

  let index = 0
  let mentions = []
  let suggestions = []
  let input = null
  let prevContent = ''

  const search = fuzzy(
    database.people.all({'kind0.name:!nil': null}),
    {keys: ["kind0.name", "pubkey"]}
  )

  const getText = () => {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)

    range.setStartBefore(input)

    const text = range.cloneContents().textContent

    range.collapse()

    return text
  }

  const getWord = () => {
    return last(getText().split(/[\s\u200B]+/))
  }

  const highlightWord = (prefix, chars, content) => {
    const text = getText()
    const selection = document.getSelection()
    const {focusNode, focusOffset} = selection
    const prefixElement = document.createTextNode(prefix)
    const span = document.createElement('span')

    // Space includes a zero-width space to avoid having the cursor end up inside
    // mention span on backspace, and a space for convenience in composition.
    const space = document.createTextNode("\u200B\u00a0")

    span.classList.add('underline')
    span.innerText = content

    // Remove our partial mention text
    selection.setBaseAndExtent(...fromParentOffset(input, text.length - chars), focusNode, focusOffset)
    selection.deleteFromDocument()

    // Add the prefix, decorated text, and a trailing space
    selection.getRangeAt(0).insertNode(prefixElement)
    selection.collapse(prefixElement, 1)
    selection.getRangeAt(0).insertNode(span)
    selection.collapse(span.nextSibling, 0)
    selection.getRangeAt(0).insertNode(space)
    selection.collapse(space, 2)
  }

  const pickSuggestion = person => {
    const display = displayPerson(person)

    highlightWord('@', getWord().length, display)

    mentions.push({
      pubkey: person.pubkey,
      length: display.length + 1,
      end: getText().length - 2,
    })

    index = 0
    suggestions = []
  }

  const onKeyDown = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      return onSubmit()
    }

    if (e.key === 'Escape' && suggestions[index]) {
      index = 0
      suggestions = []
      e.stopPropagation()
    }

    if (['Enter', 'Tab', 'ArrowUp', 'ArrowDown', ' '].includes(e.key) && suggestions[index]) {
      e.preventDefault()
    }
  }

  const onKeyUp = e => {
    if (['Enter', 'Tab', ' '].includes(e.key) && suggestions[index]) {
      pickSuggestion(suggestions[index])
    }

    if (e.key === 'ArrowUp' && suggestions[index - 1]) {
      index -= 1
    }

    if (e.key === 'ArrowDown' && suggestions[index + 1]) {
      index += 1
    }

    if (input.innerText !== prevContent) {
      const text = getText()
      const word = getWord()

      if (!text.match(/\s$/) && word.startsWith('@')) {
        suggestions = search(word.slice(1)).slice(0, 3)
      } else {
        index = 0
        suggestions = []
      }

      if (input.innerText.length < prevContent.length) {
        const delta = prevContent.length - input.innerText.length
        const text = getText()

        for (const mention of mentions) {
          if (mention.end - mention.length > text.length) {
            mention.end -= delta
          } else if (mention.end > text.length) {
            mention.invalid = true
          }
        }
      }
    }

    if (input.innerText.length > prevContent.length) {
      const topic = getText().match(/#([-\w]+\s)$/)

      if (topic) {
        highlightWord('#', topic[0].length, topic[1].trim())
      }
    }

    prevContent = input.innerText
  }

  export const trigger = events => {
    ensurePlural(events).forEach(onKeyUp)
  }

  export const type = text => {
    for (const c of Array.from(text)) {
      input.innerText += c

      const selection = document.getSelection()
      const extent = fromParentOffset(input, input.innerText.length)

      selection.setBaseAndExtent(...extent, ...extent)

      onKeyUp({key: c})
    }

  }

  export const parse = () => {
    // Interpolate mentions
    let offset = 0
    let content = input.innerText
    const validMentions = sortBy(prop('end'), reject(prop('invalid'), mentions))
    for (const [i, {end, length}] of validMentions.entries()) {
      const offsetEnd = end - offset
      const start = offsetEnd - length
      const tag = `#[${i}]`

      content = content.slice(0, start) + tag + content.slice(offsetEnd)
      offset += length - tag.length
    }

    // Remove our zero-length spaces
    content = content.replace(/\u200B/g, '')

    return {
      content,
      topics: content.match(/#[-\w]+/g) || [],
      mentions: validMentions.map(prop('pubkey')),
    }
  }

  onMount(() => {
    input.addEventListener('paste', e => {
      e.preventDefault()

      const clipboardData = e.clipboardData || (window as any).clipboardData
      const text = clipboardData.getData('text')
      const selection = window.getSelection()

      if (selection.rangeCount) {
        selection.deleteFromDocument()
        selection.getRangeAt(0).insertNode(document.createTextNode(text))
      }
    })
  })

</script>

<div class="flex">
  <div
    class="text-white w-full outline-0 p-2"
    autofocus
    contenteditable
    bind:this={input}
    on:keydown={onKeyDown}
    on:keyup={onKeyUp} />
  <slot name="addon" />
</div>

{#if suggestions.length > 0}
<div class="rounded border border-solid border-medium mt-2 flex flex-col" in:fly={{y: 20}}>
  {#each suggestions as person, i (person.pubkey)}
  <button
    class="py-2 px-4 cursor-pointer border-l-2 border-solid border-black"
    class:bg-black={index !== i}
    class:bg-dark={index === i}
    class:border-accent={index === i}
    on:click={() => pickSuggestion(person)}>
    <Badge inert {person} />
  </button>
  {/each}
</div>
{/if}
