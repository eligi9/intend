export function wrapTextAtCharacterLimit(text: string, limit: number) {
  const lines: string[] = []
  let currentLine = ''

  text.trim().split(/\s+/).forEach((word) => {
    while (word.length > limit) {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = ''
      }
      lines.push(word.slice(0, limit))
      word = word.slice(limit)
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (currentLine && nextLine.length > limit) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = nextLine
    }
  })

  if (currentLine) lines.push(currentLine)
  return lines.join('\n')
}
