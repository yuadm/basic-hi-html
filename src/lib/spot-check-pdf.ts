import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import DejaVuSansRegularUrl from '@/assets/fonts/dejavu/DejaVuSans.ttf'
import DejaVuSansBoldUrl from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf'
import { format } from 'date-fns'

import type { SpotCheckFormData } from '@/components/compliance/SpotCheckFormDialog'

interface CompanyInfo {
  name?: string
  logo?: string
}

export async function generateSpotCheckPdf(data: SpotCheckFormData, company?: CompanyInfo) {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  let page = doc.addPage()
  const regularBytes = await fetch(DejaVuSansRegularUrl).then(r => r.arrayBuffer())
  const boldBytes = await fetch(DejaVuSansBoldUrl).then(r => r.arrayBuffer())
  const font = await doc.embedFont(new Uint8Array(regularBytes), { subset: true })
  const boldFont = await doc.embedFont(new Uint8Array(boldBytes), { subset: true })

  const margin = 40
  const lineHeight = 16
  let y = page.getHeight() - margin

  const drawText = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const f = opts?.bold ? boldFont : font
    const size = opts?.size ?? 11
    page.drawText(text ?? '', {
      x: margin,
      y: y - lineHeight,
      size,
      font: f,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight
  }

  const addSpacer = (amount = 8) => { y -= amount }

  const drawKeyVal = (label: string, value?: string) => {
    const labelText = `${label}: `
    const labelWidth = boldFont.widthOfTextAtSize(labelText, 11)
    page.drawText(labelText, { x: margin, y: y - lineHeight, size: 11, font: boldFont, color: rgb(0,0,0) })
    page.drawText(String(value ?? ''), { x: margin + labelWidth, y: y - lineHeight, size: 11, font, color: rgb(0,0,0) })
    y -= lineHeight
  }

  // Header
  drawText(company?.name || 'Company', { bold: true, size: 16 })
  drawText('Spot Check Report', { bold: true, size: 14 })
  drawText(`Generated: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`, { size: 10 })
  addSpacer(6)
  page.drawRectangle({ x: margin, y: y - 2, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.85,0.85,0.85) })
  y -= 8

  // Details
  drawText('A. Details', { bold: true, size: 13 })
  addSpacer(4)
  drawKeyVal("Service User's Name", data.serviceUserName)
  drawKeyVal('Care Worker 1', data.careWorker1)
  if (data.careWorker2) drawKeyVal('Care Worker 2', data.careWorker2)
  drawKeyVal('Date of Spot Check', data.date)
  drawKeyVal('Time From', data.timeFrom)
  drawKeyVal('Time To', data.timeTo)
  drawKeyVal('Carried Out By', data.carriedBy)

  addSpacer(10)
  drawText('B. Observations', { bold: true, size: 13 })
  addSpacer(6)

  // Table headers
  const tableX = margin
  const colItem = 300
  const colYes = 60
  const colNo = 60
  const colComments = page.getWidth() - margin - (tableX + colItem + colYes + colNo)

  const textSize = 11
  const baseRowHeight = 24
  const cellPadX = 6
  const cellPadY = 6

  const wrapText = (text: string, width: number, f = font) => {
    const words = (text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    const maxWidth = width - cellPadX * 2

    const pushHardWrapped = (word: string) => {
      let remaining = word
      while (remaining.length > 0 && f.widthOfTextAtSize(remaining, textSize) > maxWidth) {
        let cut = Math.min(remaining.length, 50)
        while (cut > 1 && f.widthOfTextAtSize(remaining.slice(0, cut), textSize) > maxWidth) {
          cut--
        }
        lines.push(remaining.slice(0, cut))
        remaining = remaining.slice(cut)
      }
      if (remaining) {
        if (f.widthOfTextAtSize(remaining, textSize) <= maxWidth) {
          if (!line) line = remaining
          else if (f.widthOfTextAtSize(line + ' ' + remaining, textSize) <= maxWidth) line = line + ' ' + remaining
          else { lines.push(line); line = remaining }
        }
      }
    }

    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (f.widthOfTextAtSize(test, textSize) <= maxWidth) {
        line = test
      } else {
        if (!line) {
          pushHardWrapped(word)
        } else {
          lines.push(line)
          line = ''
          if (f.widthOfTextAtSize(word, textSize) <= maxWidth) {
            line = word
          } else {
            pushHardWrapped(word)
          }
        }
      }
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }

  const measureCellHeight = (text: string, width: number, f = font) => {
    const lines = wrapText(text, width, f)
    return Math.max(baseRowHeight, lines.length * lineHeight + cellPadY * 2)
  }

  const drawHeader = () => {
    const headerHeight = 28
    page.drawRectangle({ x: tableX, y: y - headerHeight + 5, width: page.getWidth() - margin * 2, height: headerHeight, color: rgb(0.95,0.96,1) })
    const boldF = boldFont
    const yesX = tableX + colItem
    const noX = yesX + colYes
    const commentsX = noX + colNo
    page.drawText('Item', { x: tableX + cellPadX, y: y - headerHeight + 9, size: 11, font: boldF, color: rgb(0,0,0) })
    const centerHeader = (text: string, x: number, width: number) => {
      const tw = boldF.widthOfTextAtSize(text, 11)
      page.drawText(text, { x: x + (width - tw) / 2, y: y - headerHeight + 9, size: 11, font: boldF, color: rgb(0,0,0) })
    }
    centerHeader('Yes', yesX, colYes)
    centerHeader('No', noX, colNo)
    page.drawText('Observation/comments (required for all no responses)', { x: commentsX + cellPadX, y: y - headerHeight + 9, size: 11, font: boldF, color: rgb(0,0,0) })
    y -= headerHeight
    page.drawRectangle({ x: tableX, y: y - 1 + 5, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.92,0.92,0.92) })
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage()
      y = page.getHeight() - margin
      drawHeader()
    }
  }

  // initial header
  drawHeader()

  data.observations.forEach((obs, i) => {
    const itemHeight = measureCellHeight(obs.label || '', colItem)
    const commentsHeight = measureCellHeight(obs.comments || '', colComments)
    let currentRowHeight = Math.max(itemHeight, commentsHeight, baseRowHeight)

    ensureSpace(currentRowHeight)

    if (i % 2 === 0) {
      page.drawRectangle({ x: tableX, y: y - currentRowHeight + 5, width: page.getWidth() - margin * 2, height: currentRowHeight, color: rgb(0.98,0.98,0.99) })
    }

    const itemLines = wrapText(obs.label || '', colItem)
    itemLines.forEach((line, idx) => {
      page.drawText(line, { x: tableX + cellPadX, y: y - cellPadY - (idx + 1) * lineHeight, size: textSize, font, color: rgb(0,0,0) })
    })

    const centerY = y - currentRowHeight / 2 - textSize / 2 + 4
    if (obs.value === 'yes') {
      const tw = font.widthOfTextAtSize('✔', textSize)
      page.drawText('✔', { x: tableX + colItem + (colYes - tw) / 2, y: centerY, size: textSize, font, color: rgb(0,0,0) })
    }
    if (obs.value === 'no') {
      const tw = font.widthOfTextAtSize('✔', textSize)
      page.drawText('✔', { x: tableX + colItem + colYes + (colNo - tw) / 2, y: centerY, size: textSize, font, color: rgb(0,0,0) })
    }

    const commentsLines = wrapText(obs.comments || '', colComments)
    commentsLines.forEach((line, idx) => {
      page.drawText(line, { x: tableX + colItem + colYes + colNo + cellPadX, y: y - cellPadY - (idx + 1) * lineHeight, size: textSize, font, color: rgb(0,0,0) })
    })

    y -= currentRowHeight
    page.drawRectangle({ x: tableX, y: y - 1 + 5, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.92,0.92,0.92) })
  })

  addSpacer(12)
  drawText('End of Report', { size: 10 })

  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const filename = `Spot_Check_${data.serviceUserName?.replace(/\s+/g, '_') || 'Report'}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
