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
  const page = doc.addPage()
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

  const rowHeight = 24
  const drawTableCell = (text: string, x: number, width: number, opts?: { bold?: boolean; align?: 'left' | 'center' }) => {
    const f = opts?.bold ? boldFont : font
    const size = 11
    const content = text ?? ''
    const textWidth = f.widthOfTextAtSize(content, size)
    const tx = opts?.align === 'center' ? x + (width - textWidth) / 2 : x + 6
    page.drawText(content, { x: tx, y: y - rowHeight + 7, size, font: f, color: rgb(0,0,0) })
  }
  const drawRowDivider = () => {
    page.drawRectangle({ x: tableX, y: y - rowHeight + 5, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.92,0.92,0.92) })
  }

  // Header row
  page.drawRectangle({ x: tableX, y: y - rowHeight + 5, width: page.getWidth() - margin * 2, height: rowHeight, color: rgb(0.95,0.96,1) })
  drawTableCell('Item', tableX, colItem, { bold: true })
  drawTableCell('Yes', tableX + colItem, colYes, { bold: true, align: 'center' })
  drawTableCell('No', tableX + colItem + colYes, colNo, { bold: true, align: 'center' })
  drawTableCell('Observation/comments (required for all no responses)', tableX + colItem + colYes + colNo, colComments, { bold: true })
  y -= rowHeight
  drawRowDivider()

  data.observations.forEach((obs, i) => {
    // Alternate row background for readability
    if (i % 2 === 0) {
      page.drawRectangle({ x: tableX, y: y - rowHeight + 5, width: page.getWidth() - margin * 2, height: rowHeight, color: rgb(0.98,0.98,0.99) })
    }
    drawTableCell(obs.label, tableX, colItem)
    drawTableCell(obs.value === 'yes' ? '✔' : '', tableX + colItem, colYes, { align: 'center' })
    drawTableCell(obs.value === 'no' ? '✔' : '', tableX + colItem + colYes, colNo, { align: 'center' })
    drawTableCell(obs.comments || '', tableX + colItem + colYes + colNo, colComments)
    y -= rowHeight
    drawRowDivider()
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
