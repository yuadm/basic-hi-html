import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import DejaVuSansRegularUrl from '@/assets/fonts/dejavu/DejaVuSans.ttf'
import DejaVuSansBoldUrl from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf'
import { format } from 'date-fns'
import type { SupervisionFormData } from '@/components/compliance/SupervisionFormDialog'

interface CompanyInfo {
  name?: string
  logo?: string
}

export async function generateSupervisionPdf(data: SupervisionFormData, company?: CompanyInfo) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  // Fonts
  const regularBytes = await fetch(DejaVuSansRegularUrl).then(r => r.arrayBuffer())
  const boldBytes = await fetch(DejaVuSansBoldUrl).then(r => r.arrayBuffer())
  const font = await doc.embedFont(new Uint8Array(regularBytes), { subset: true })
  const boldFont = await doc.embedFont(new Uint8Array(boldBytes), { subset: true })

  // Try to embed company logo once (optional)
  let embeddedLogo: any | undefined
  if (company?.logo) {
    try {
      const logoBytes = await fetch(company.logo).then(r => r.arrayBuffer())
      try {
        embeddedLogo = await doc.embedPng(logoBytes)
      } catch {
        embeddedLogo = await doc.embedJpg(logoBytes)
      }
    } catch {
      embeddedLogo = undefined
    }
  }

  // Layout constants
  const marginX = 48
  const marginTop = 64
  const marginBottom = 56
  const lineHeight = 16
  const sectionGap = 10
  const pageWidth = () => page.getWidth()
  const contentWidth = () => pageWidth() - marginX * 2

  // Colors
  const textColor = rgb(0, 0, 0)
  const subtle = rgb(0.6, 0.6, 0.6)
  const divider = rgb(0.85, 0.85, 0.85)
  const sectionBg = rgb(0.96, 0.96, 0.98)

  // Page state
  let page = doc.addPage()
  let y = page.getHeight() - marginTop
  let pageIndex = 1

  const drawHeader = () => {
    const headerHeight = 50
    // Top rule
    page.drawRectangle({ x: 0, y: page.getHeight() - headerHeight, width: page.getWidth(), height: headerHeight, color: rgb(0.98, 0.98, 0.985) })

    const leftX = marginX
    let cursorX = leftX

    if (embeddedLogo) {
      const logoW = 36
      const logoH = (embeddedLogo.height / embeddedLogo.width) * logoW
      page.drawImage(embeddedLogo, { x: cursorX, y: page.getHeight() - headerHeight + (headerHeight - logoH) / 2, width: logoW, height: logoH })
      cursorX += logoW + 12
    }

    const companyName = company?.name || 'Company'
    page.drawText(companyName, { x: cursorX, y: page.getHeight() - 24, size: 13, font: boldFont, color: textColor })
    page.drawText('Supervision Report', { x: cursorX, y: page.getHeight() - 40, size: 11, font: font, color: subtle })

    // Date on right

    // Divider
    page.drawRectangle({ x: marginX, y: page.getHeight() - headerHeight - 1, width: page.getWidth() - marginX * 2, height: 1, color: divider })

    // Reset content Y just below header
    y = page.getHeight() - headerHeight - 14
  }

  const drawFooter = () => {
    const footerY = marginBottom - 24
    page.drawRectangle({ x: marginX, y: footerY + 12, width: page.getWidth() - marginX * 2, height: 1, color: divider })
    const footerText = `Page ${pageIndex}`
    page.drawText(footerText, { x: marginX, y: footerY, size: 10, font, color: subtle })
  }

  const newPage = () => {
    if (pageIndex === 1) {
      // First page header
      drawHeader()
    } else {
      drawFooter()
      page = doc.addPage()
      drawHeader()
    }
    y = Math.min(y, page.getHeight() - marginTop)
    pageIndex += pageIndex === 1 ? 0 : 1
  }

  // Initialize first page header
  drawHeader()

  const ensureSpace = (needed: number) => {
    if (y - needed < marginBottom) {
      drawFooter()
      page = doc.addPage()
      pageIndex += 1
      drawHeader()
    }
  }

  const drawSectionTitle = (title: string) => {
    const pad = 6
    const h = 24
    ensureSpace(h + 6)
    page.drawRectangle({ x: marginX, y: y - h + pad, width: contentWidth(), height: h, color: sectionBg })
    page.drawText(title, { x: marginX + 10, y: y - h + pad + 6, size: 12, font: boldFont, color: textColor })
    y -= h + 6
  }

  const drawDivider = () => {
    ensureSpace(10)
    page.drawRectangle({ x: marginX, y: y - 2, width: contentWidth(), height: 1, color: divider })
    y -= 10
  }

  // Thin divider for separating answers within a section
  const drawAnswerDivider = () => {
    ensureSpace(6)
    page.drawRectangle({ x: marginX, y: y - 1, width: contentWidth(), height: 0.5, color: divider })
    y -= 6
  }

  const wrapText = (text: string, width: number, f = font, size = 11) => {
    const words = (text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (f.widthOfTextAtSize(test, size) <= width) line = test
      else { if (line) lines.push(line); line = w }
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }

  const drawTextLine = (text: string, opts?: { bold?: boolean; size?: number; x?: number }) => {
    const f = opts?.bold ? boldFont : font
    const size = opts?.size ?? 11
    const x = opts?.x ?? marginX
    ensureSpace(lineHeight)
    page.drawText(text ?? '', { x, y: y - lineHeight, size, font: f, color: textColor })
    y -= lineHeight
  }

  const drawKeyVal = (label: string, value?: string) => {
    const labelText = `${label}: `
    const labelSize = 11
    const labelWidth = boldFont.widthOfTextAtSize(labelText, labelSize)
    const maxValWidth = contentWidth() - labelWidth
    const lines = wrapText(String(value ?? ''), maxValWidth, font, labelSize)

    ensureSpace(lineHeight * Math.max(1, lines.length))
    // Label
    page.drawText(labelText, { x: marginX, y: y - lineHeight, size: labelSize, font: boldFont, color: textColor })
    // First value line on same line as label
    if (lines.length) {
      page.drawText(lines[0], { x: marginX + labelWidth, y: y - lineHeight, size: labelSize, font, color: textColor })
    }
    y -= lineHeight
    // Remaining lines
    for (let i = 1; i < lines.length; i++) {
      drawTextLine(lines[i])
    }
  }

  const drawParagraph = (title: string, content?: string) => {
    if (!content) return
    drawTextLine(title, { bold: true })
    const lines = wrapText(content, contentWidth())
    for (const l of lines) drawTextLine(l)
    y -= 4
  }

  // Report Details
  drawSectionTitle('Report Details')
  drawKeyVal('Date of Supervision', data.dateOfSupervision)
  drawKeyVal('Employee (Signature)', data.signatureEmployee)
  drawDivider()

  // Personal Section
  drawSectionTitle('Personal')
  // Compute a background area height for the section content
  const personalItems: Array<{ title: string; content?: string }> = [
    { title: 'How are you', content: data.howAreYou },
    { title: 'Guidelines & Policy discussions', content: data.proceduralGuidelines },
    { title: 'Staff Issues', content: data.staffIssues },
    { title: 'Training & Development', content: data.trainingAndDevelopment },
    { title: 'Key Areas of Responsibility', content: data.keyAreasOfResponsibility },
    { title: 'Other issues', content: data.otherIssues },
  ]
  const annualText = (data.annualLeaveTaken?.trim() || data.annualLeaveBooked?.trim() || '')
  const annualLabel = 'Annual Leave (Taken/Booked): '
  const annualLabelWidth = boldFont.widthOfTextAtSize(annualLabel, 11)
  let personalHeight = 0
  for (const item of personalItems) {
    if (item.content) {
      const lines = wrapText(item.content, contentWidth())
      personalHeight += lineHeight // title
      personalHeight += lines.length * lineHeight
      personalHeight += 4 // paragraph spacing
      personalHeight += 6 // divider
    } else {
      // still keep divider spacing to visually separate answers
      personalHeight += 6
    }
  }
  const annualLines = wrapText(annualText, contentWidth() - annualLabelWidth)
  personalHeight += Math.max(1, annualLines.length) * lineHeight
  personalHeight += 6 // divider after annual
  ensureSpace(personalHeight)
  page.drawRectangle({ x: marginX, y: y - personalHeight, width: contentWidth(), height: personalHeight, color: sectionBg })

  // Now render the actual content on top of the background
  for (const item of personalItems) {
    drawParagraph(item.title, item.content as string | undefined)
    drawAnswerDivider()
  }
  drawKeyVal('Annual Leave (Taken/Booked)', annualText)
  drawAnswerDivider()

  // Service Users Section
  drawDivider()
  drawSectionTitle('Service Users')
  drawKeyVal('Count', String(data.serviceUsersCount || 0))
  const names = (data.serviceUserNames || []).filter(Boolean)
  if (names.length) drawParagraph('Names', names.join(', '))

  const yesNo = (o?: { value?: 'yes'|'no'; reason?: string }) => `${o?.value || ''}${o?.reason ? ` - ${o.reason}` : ''}`

  for (const [idx, su] of (data.perServiceUser || []).entries()) {
    // Build content lines then wrap to keep text within the box width
    const entries: string[] = []
    entries.push(`Service User #${idx + 1}: ${su.serviceUserName || ''}`)
    entries.push(`Concerns: ${yesNo(su.concerns)}`)
    entries.push(`Comfortable working: ${yesNo(su.comfortable)}`)
    entries.push(`Comments about service: ${yesNo(su.commentsAboutService)}`)
    entries.push(`Complaints made: ${yesNo(su.complaintsByServiceUser)}`)
    entries.push(`Safeguarding issues: ${yesNo(su.safeguardingIssues)}`)
    entries.push(`Other discussion: ${yesNo(su.otherDiscussion)}`)
    entries.push(`Bruises: ${yesNo(su.bruises)}`)
    if (su.bruises?.value === 'yes' && su.bruisesCauses) entries.push(`Bruises causes: ${su.bruisesCauses}`)
    entries.push(`Pressure sores: ${yesNo(su.pressureSores)}`)

    const boxPad = 10
    const maxBoxWidth = contentWidth() - boxPad * 2
    const wrappedTitle = wrapText(entries[0], maxBoxWidth, boldFont, 11)

    // Prepare key-value rows with bold question (label) and wrapped answer
    const kvs = entries.slice(1).map((t) => {
      const idx = t.indexOf(':')
      const label = (idx >= 0 ? t.slice(0, idx) : t) + ': '
      const value = idx >= 0 ? t.slice(idx + 1).trim() : ''
      const labelWidth = boldFont.widthOfTextAtSize(label, 11)
      const valueLines = wrapText(value, maxBoxWidth - labelWidth, font, 11)
      const linesCount = Math.max(1, valueLines.length)
      return { label, labelWidth, valueLines, linesCount }
    })

    const totalLines = wrappedTitle.length + kvs.reduce((sum, kv) => sum + kv.linesCount, 0)
    const boxHeight = totalLines * lineHeight + boxPad * 2
    ensureSpace(boxHeight + 8)

    // Box background
    page.drawRectangle({ x: marginX, y: y - boxHeight, width: contentWidth(), height: boxHeight, color: rgb(0.985, 0.985, 0.99) })
    // Box border
    page.drawRectangle({ x: marginX, y: y - boxHeight, width: contentWidth(), height: boxHeight, borderColor: divider, borderWidth: 1, color: undefined as any })

    let innerY = y - boxPad
    const drawInBox = (t: string, bold = false) => {
      const f = bold ? boldFont : font
      page.drawText(t, { x: marginX + boxPad, y: innerY - lineHeight, size: 11, font: f, color: textColor })
      innerY -= lineHeight
    }

    // Title (bold)
    for (const l of wrappedTitle) drawInBox(l, true)

    // Rows with bold label and wrapped answer kept inside the box
    for (const kv of kvs) {
      // First line: label + first answer line
      page.drawText(kv.label, { x: marginX + boxPad, y: innerY - lineHeight, size: 11, font: boldFont, color: textColor })
      if (kv.valueLines.length) {
        page.drawText(kv.valueLines[0], { x: marginX + boxPad + kv.labelWidth, y: innerY - lineHeight, size: 11, font, color: textColor })
      }
      innerY -= lineHeight
      // Remaining lines of the answer aligned under the first answer column
      for (let i = 1; i < kv.valueLines.length; i++) {
        page.drawText(kv.valueLines[i], { x: marginX + boxPad + kv.labelWidth, y: innerY - lineHeight, size: 11, font, color: textColor })
        innerY -= lineHeight
      }
    }

    y -= boxHeight + 8
  }

  // Office Use
  drawDivider()
  drawSectionTitle('For Office Use Only')
  drawKeyVal('Name of employee', data.office?.employeeName)
  drawKeyVal('Project', data.office?.project)
  drawKeyVal('Supervisor', data.office?.supervisor)
  drawKeyVal('Date', data.office?.date)

  const actions = (data.office?.actions || []).filter(a => a.issue || a.action || a.byWhom || a.dateCompleted)
  if (actions.length) {
    y -= 4
    // Table
    const cols = [0.32, 0.38, 0.16, 0.14] // Issue, Action, ByWhom, Date
    const colWidths = cols.map(c => c * contentWidth())

    const drawTableHeader = () => {
      ensureSpace(28)
      const h = 22
      page.drawRectangle({ x: marginX, y: y - h, width: contentWidth(), height: h, color: sectionBg })
      const headers = ['Issue', 'Action', 'By Whom', 'Date Completed']
      let cx = marginX + 8
      for (let i = 0; i < headers.length; i++) {
        page.drawText(headers[i], { x: cx, y: y - h + 6, size: 11, font: boldFont, color: textColor })
        cx += colWidths[i]
      }
      y -= h + 4
    }

    const drawRow = (row: { issue?: string; action?: string; byWhom?: string; dateCompleted?: string }) => {
      const cells = [row.issue || '', row.action || '', row.byWhom || '', row.dateCompleted || '']
      const wrapped = cells.map((c, i) => wrapText(c, colWidths[i] - 12))
      const maxLines = Math.max(...wrapped.map(w => w.length))
      const rowH = Math.max(lineHeight * maxLines + 8, 22)
      ensureSpace(rowH)
      // Row box
      page.drawRectangle({ x: marginX, y: y - rowH, width: contentWidth(), height: rowH, color: rgb(1,1,1) })
      // Cell texts
      let cx = marginX + 8
      for (let i = 0; i < wrapped.length; i++) {
        let cy = y - 6
        for (const l of wrapped[i]) {
          page.drawText(l, { x: cx, y: cy - lineHeight, size: 11, font, color: textColor })
          cy -= lineHeight
        }
        cx += colWidths[i]
      }
      y -= rowH
    }

    drawTableHeader()
    for (const a of actions) drawRow(a)
  }

  // Save & download
  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const filename = `Supervision_${(data.signatureEmployee || 'Report').replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
