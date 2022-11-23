export const copyToClipboard = text => {
  const {activeElement} = document
  const input = document.createElement("textarea")

  input.innerHTML = text
  document.body.appendChild(input)
  input.select()

  const result = document.execCommand("copy")

  document.body.removeChild(input)
  activeElement.focus()

  return result
}
