function toCSVValue(value) {
  const str = value === null || value === undefined ? '' : String(value)
  // Quote (and escape embedded quotes in) any field that contains a comma,
  // quote, or newline — the three characters that would otherwise corrupt
  // the column structure.
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

// `columns` is [{ label, value(row) }, ...] — a small declarative shape so
// callers don't have to know anything about CSV escaping, just how to
// pull each column out of one of their own row objects.
export function downloadCSV(filename, rows, columns) {
  const lines = [
    columns.map((c) => toCSVValue(c.label)).join(','),
    ...rows.map((row) => columns.map((c) => toCSVValue(c.value(row))).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
