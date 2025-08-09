import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import type { SpotCheckFormData } from '@/components/compliance/SpotCheckFormDialog'

interface CompanyInfo {
  name?: string
  logo?: string
}

export async function generateSpotCheckPdf(data: SpotCheckFormData, company?: CompanyInfo) {
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

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

  const drawTableCell = (text: string, x: number, width: number, bold = false) => {
    page.drawText(text ?? '', { x, y: y - 14, size: 11, font: bold ? boldFont : font, color: rgb(0,0,0) })
  }
  const drawRowDivider = () => {
    page.drawRectangle({ x: tableX, y: y - 18, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.92,0.92,0.92) })
  }

  // Header row
  drawTableCell('Item', tableX, colItem, true)
  drawTableCell('Yes', tableX + colItem, colYes, true)
  drawTableCell('No', tableX + colItem + colYes, colNo, true)
  drawTableCell('Comments', tableX + colItem + colYes + colNo, colComments, true)
  y -= 20
  drawRowDivider()

  data.observations.forEach((obs) => {
    drawTableCell(obs.label, tableX, colItem)
    drawTableCell(obs.value === 'yes' ? 'X' : '', tableX + colItem, colYes)
    drawTableCell(obs.value === 'no' ? 'X' : '', tableX + colItem + colYes, colNo)
    drawTableCell(obs.comments || '', tableX + colItem + colYes + colNo, colComments)
    y -= 18
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
