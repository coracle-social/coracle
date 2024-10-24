const getFunctionBody = f => {
  // Test for a regular function first
  const regular = f.toString().match(/function[^{]+\{([\s\S]*)\}$/)

  if (regular) return [1]

  // Now test for an arrow function
  const arrow = f.toString().match(/^(?:\s*\(?(?:\s*\w*\s*,?\s*)*\)?\s*?=>\s*){?([\s\S]*)}?$/)

  if (arrow) {
    const body = arrow[1]

    // Needed because the RegExp doesn't handle the last '}'.
    return (body.match(/{/g) || []).length === (body.match(/}/g) || []).length - 1
      ? body.slice(0, body.lastIndexOf("}"))
      : body
  }
}

const api = {
  x: 1,
}

export const cli = (f: () => void) =>
  Function(...Object.keys(api), getFunctionBody(f))(...Object.values(api))

Object.assign(cli, api)
