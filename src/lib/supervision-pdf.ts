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
  const divider = rgb(0.85, 0.85, 0.85) // neutral borders
  const accent = rgb(0.2, 0.55, 0.95) // blue accent for section dividers
  const sectionBg = rgb(0.96, 0.97, 0.99) // light blue-tinted section background

  // Page state
  let page = doc.addPage()
  let y = page.getHeight() - marginTop
  let pageIndex = 1

  const drawHeader = () => {
    // Stacked, centered header: Logo -> Company -> Report -> Quarter/Year
    const headerHeight = embeddedLogo ? 120 : 100
    // Background
    page.drawRectangle({ x: 0, y: page.getHeight() - headerHeight, width: page.getWidth(), height: headerHeight, color: rgb(0.98, 0.98, 0.985) })

    const centerX = page.getWidth() / 2
    let cursorY = page.getHeight() - 16

    // Logo (larger) centered
    if (embeddedLogo) {
      const logoW = 72
      const logoH = (embeddedLogo.height / embeddedLogo.width) * logoW
      const logoX = centerX - logoW / 2
      const logoY = cursorY - logoH
      page.drawImage(embeddedLogo, { x: logoX, y: logoY, width: logoW, height: logoH })
      cursorY = logoY - 6
    }

    // Company name centered
    const companyName = company?.name || 'Company'
    const companySize = 13
    const companyTextWidth = boldFont.widthOfTextAtSize(companyName, companySize)
    page.drawText(companyName, { x: centerX - companyTextWidth / 2, y: cursorY - companySize, size: companySize, font: boldFont, color: textColor })
    cursorY = cursorY - companySize - 6

    // Report title centered
    const title = 'Supervision Report'
    const titleSize = 12
    const titleWidth = boldFont.widthOfTextAtSize(title, titleSize)
    page.drawText(title, { x: centerX - titleWidth / 2, y: cursorY - titleSize, size: titleSize, font: boldFont, color: textColor })
    cursorY = cursorY - titleSize - 4

    // Quarter and Year centered (based on supervision date if provided)
    const d = data?.dateOfSupervision ? new Date(data.dateOfSupervision) : new Date()
    const q = Math.floor(d.getMonth() / 3) + 1
    const qText = `Q${q} ${d.getFullYear()}`
    const qSize = 11
    const qWidth = font.widthOfTextAtSize(qText, qSize)
    page.drawText(qText, { x: centerX - qWidth / 2, y: cursorY - qSize, size: qSize, font, color: subtle })

    // Divider
    page.drawRectangle({ x: marginX, y: page.getHeight() - headerHeight - 1, width: page.getWidth() - marginX * 2, height: 2, color: accent })

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
    page.drawRectangle({ x: marginX, y: y - 2, width: contentWidth(), height: 1, color: accent })
    y -= 10
  }

  // Thin divider for separating answers within a section
  const drawAnswerDivider = () => {
    ensureSpace(6)
    page.drawRectangle({ x: marginX, y: y - 1, width: contentWidth(), height: 0.5, color: accent })
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
  // Date formatter (dd/MM/yyyy)
  const formatDateDmy = (s?: string) => {
    if (!s) return ''
    const d = new Date(s)
    return isNaN(d.getTime()) ? s : format(d, 'dd/MM/yyyy')
  }

  // Report Details
  drawSectionTitle('Report Details')
  drawKeyVal('Date of Supervision', formatDateDmy(data.dateOfSupervision))
  drawKeyVal('Employee (Signature)', data.signatureEmployee)
  drawDivider()

  // Personal Section
  drawSectionTitle('Personal')
  const personalItems: Array<{ title: string; content?: string }> = [
    { title: 'How are you', content: data.howAreYou },
    { title: 'Guidelines & Policy discussions', content: data.proceduralGuidelines },
    { title: 'Staff Issues', content: data.staffIssues },
    { title: 'Training & Development', content: data.trainingAndDevelopment },
    { title: 'Key Areas of Responsibility', content: data.keyAreasOfResponsibility },
    { title: 'Other issues', content: data.otherIssues },
  ]
  const annualText = (data.annualLeaveTaken?.trim() || data.annualLeaveBooked?.trim() || '')
  const boxPad = 12
  const drawQBox = (label: string, content?: string) => {
    const innerW = contentWidth() - boxPad * 2
    const lines = wrapText(String(content ?? ''), innerW)
    const boxH = lineHeight /*label*/ + Math.max(1, lines.length) * lineHeight + boxPad * 2
    ensureSpace(boxH + 8)
    // Box background and border
    page.drawRectangle({ x: marginX, y: y - boxH, width: contentWidth(), height: boxH, color: rgb(0.985, 0.985, 0.99) })
    page.drawRectangle({ x: marginX, y: y - boxH, width: contentWidth(), height: boxH, borderColor: divider, borderWidth: 1, color: undefined as any })
    // Content
    let innerY = y - boxPad
    page.drawText(label, { x: marginX + boxPad, y: innerY - lineHeight, size: 11, font: boldFont, color: textColor })
    innerY -= lineHeight
    if (!lines.length) lines.push('')
    for (const l of lines) {
      page.drawText(l, { x: marginX + boxPad, y: innerY - lineHeight, size: 11, font, color: textColor })
      innerY -= lineHeight
    }
    y -= boxH + 12
  }
  for (const item of personalItems) {
    drawQBox(item.title, item.content)
  }
  drawQBox('Annual Leave (Taken/Booked)', annualText)

  // Service Users Section
  drawDivider()
  drawSectionTitle('Service Users')
  drawKeyVal('Count', String(data.serviceUsersCount || 0))
  const names = (data.serviceUserNames || []).filter(Boolean)
  if (names.length) drawParagraph('Names', names.join(', '))

  

  for (const [idx, su] of (data.perServiceUser || []).entries()) {
    const boxPad = 12
    const innerW = contentWidth() - boxPad * 2

    const drawQBox = (label: string, content?: string, contentBold: boolean = false) => {
      const lines = wrapText(String(content ?? ''), innerW)
      const h = lineHeight + Math.max(1, lines.length) * lineHeight + boxPad * 2
      ensureSpace(h + 8)
      page.drawRectangle({ x: marginX, y: y - h, width: contentWidth(), height: h, color: rgb(0.985, 0.985, 0.99) })
      page.drawRectangle({ x: marginX, y: y - h, width: contentWidth(), height: h, borderColor: divider, borderWidth: 1, color: undefined as any })
      let iy = y - boxPad
      page.drawText(label, { x: marginX + boxPad, y: iy - lineHeight, size: 11, font: boldFont, color: textColor })
      iy -= lineHeight
      if (!lines.length) lines.push('')
      for (const l of lines) {
        page.drawText(l, { x: marginX + boxPad, y: iy - lineHeight, size: 11, font: contentBold ? boldFont : font, color: textColor })
        iy -= lineHeight
      }
      y -= h + 12
    }

    const drawYesNoQuestionBox = (label: string, o?: { value?: 'yes'|'no'; reason?: string }, extraReason?: { label: string; value?: string }) => {
      const btnW = 64
      const btnH = 18
      const gap = 16
      const hasReason = !!(o?.reason)
      const reasonText = hasReason ? `Reason: ${o?.reason ?? ''}` : ''
      const reasonLines = reasonText ? wrapText(reasonText, innerW) : []
      const extraText = extraReason && extraReason.value ? `${extraReason.label}: ${extraReason.value}` : ''
      const extraLines = extraText ? wrapText(extraText, innerW) : []
      const h = lineHeight /*label*/ + (btnH + 10) + reasonLines.length * lineHeight + extraLines.length * lineHeight + boxPad * 2
      ensureSpace(h + 8)
      // Box
      page.drawRectangle({ x: marginX, y: y - h, width: contentWidth(), height: h, color: rgb(0.985, 0.985, 0.99) })
      page.drawRectangle({ x: marginX, y: y - h, width: contentWidth(), height: h, borderColor: divider, borderWidth: 1, color: undefined as any })
      let iy = y - boxPad
      // Label
      page.drawText(label, { x: marginX + boxPad, y: iy - lineHeight, size: 11, font: boldFont, color: textColor })
      iy -= lineHeight + 10
      // Buttons row
      const yesSelected = o?.value === 'yes'
      const noSelected = o?.value === 'no'
      const yesX = marginX + boxPad
      const noX = yesX + btnW + gap
      const btnY = iy - btnH
      // Yes button
      page.drawRectangle({ x: yesX, y: btnY, width: btnW, height: btnH, color: yesSelected ? rgb(0.9, 0.98, 0.92) : rgb(1,1,1), borderColor: yesSelected ? rgb(0.2, 0.6, 0.3) : divider, borderWidth: 1 })
      page.drawText(`✓ Yes`, { x: yesX + 8, y: btnY + 4, size: 10, font: boldFont, color: yesSelected ? rgb(0.2, 0.6, 0.3) : subtle })
      // If selected in B&W: add vertical stripes and double border
      if (yesSelected) {
        for (let sx = yesX + 2; sx < yesX + btnW - 2; sx += 4) {
          page.drawRectangle({ x: sx, y: btnY + 2, width: 1, height: btnH - 4, color: rgb(0.5, 0.5, 0.5) })
        }
        page.drawRectangle({ x: yesX + 1, y: btnY + 1, width: btnW - 2, height: btnH - 2, borderColor: rgb(0.2, 0.6, 0.3), borderWidth: 1, color: undefined as any })
      }

      // No button
      page.drawRectangle({ x: noX, y: btnY, width: btnW, height: btnH, color: noSelected ? rgb(0.99, 0.92, 0.92) : rgb(1,1,1), borderColor: noSelected ? rgb(0.75, 0.2, 0.2) : divider, borderWidth: 1 })
      page.drawText(`✗ No`, { x: noX + 8, y: btnY + 4, size: 10, font: boldFont, color: noSelected ? rgb(0.75, 0.2, 0.2) : subtle })
      // If selected in B&W: add horizontal stripes and double border
      if (noSelected) {
        for (let sy = btnY + 2; sy < btnY + btnH - 2; sy += 4) {
          page.drawRectangle({ x: noX + 2, y: sy, width: btnW - 4, height: 1, color: rgb(0.5, 0.5, 0.5) })
        }
        page.drawRectangle({ x: noX + 1, y: btnY + 1, width: btnW - 2, height: btnH - 2, borderColor: rgb(0.75, 0.2, 0.2), borderWidth: 1, color: undefined as any })
      }

      iy = btnY - 16
      // Reason lines
      for (const l of reasonLines) {
        page.drawText(l, { x: marginX + boxPad, y: iy - lineHeight, size: 11, font, color: textColor })
        iy -= lineHeight
      }
      for (const l of extraLines) {
        page.drawText(l, { x: marginX + boxPad, y: iy - lineHeight, size: 11, font, color: textColor })
        iy -= lineHeight
      }
      y -= h + 8
    }

    // Title box and questions
    drawQBox(`Service User #${idx + 1}:`, su.serviceUserName || '', true)
    drawYesNoQuestionBox('Concerns', su.concerns)
    drawYesNoQuestionBox('Comfortable working', su.comfortable)
    drawYesNoQuestionBox('Comments about service', su.commentsAboutService)
    drawYesNoQuestionBox('Complaints made', su.complaintsByServiceUser)
    drawYesNoQuestionBox('Safeguarding issues', su.safeguardingIssues)
    drawYesNoQuestionBox('Other discussion', su.otherDiscussion)
    drawYesNoQuestionBox('Bruises', su.bruises, su.bruises?.value === 'yes' && su.bruisesCauses ? { label: 'Bruises causes', value: su.bruisesCauses } : undefined)
    drawYesNoQuestionBox('Pressure sores', su.pressureSores)
  }

  // Office Use
  drawDivider()
  // Force this entire section onto a fresh page
  drawFooter()
  page = doc.addPage()
  pageIndex += 1
  drawHeader()
  drawSectionTitle('For Office Use Only')
  drawKeyVal('Name of employee', data.office?.employeeName)
  drawKeyVal('Project', data.office?.project)
  drawKeyVal('Supervisor', data.office?.supervisor)
  drawKeyVal('Date', formatDateDmy(data.office?.date))

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
      const cells = [row.issue || '', row.action || '', row.byWhom || '', formatDateDmy(row.dateCompleted)]
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
