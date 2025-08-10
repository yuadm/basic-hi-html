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
    page.drawText(text ?? '', { x: margin, y: y - lineHeight, size, font: f, color: rgb(0,0,0) })
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

  const wrapText = (text: string, width: number, f = font) => {
    const words = (text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    const maxWidth = width
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (f.widthOfTextAtSize(test, 11) <= maxWidth) line = test
      else { if (line) lines.push(line); line = w }
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }

  const drawParagraph = (title: string, content?: string) => {
    if (!content) return
    drawText(title, { bold: true })
    const maxWidth = page.getWidth() - margin * 2
    const lines = wrapText(content, maxWidth)
    for (const l of lines) drawText(l)
    addSpacer(6)
  }

  // Header
  drawText(company?.name || 'Company', { bold: true, size: 16 })
  drawText('Supervision Report', { bold: true, size: 14 })
  drawText(`Generated: ${format(new Date(), 'dd-MM-yyyy HH:mm')}`, { size: 10 })
  addSpacer(6)
  page.drawRectangle({ x: margin, y: y - 2, width: page.getWidth() - margin * 2, height: 1, color: rgb(0.85,0.85,0.85) })
  y -= 8

  // Personal
  drawText('Personal Questions', { bold: true, size: 13 })
  addSpacer(4)
  drawKeyVal('Date of Supervision', data.dateOfSupervision)
  drawKeyVal('Signature (Employee)', data.signatureEmployee)
  addSpacer(4)
  drawParagraph('How are you', data.howAreYou)
  drawParagraph('Guidelines & Policy discussions', data.proceduralGuidelines)
  drawParagraph('Staff Issues', data.staffIssues)
  drawParagraph('Training & Development', data.trainingAndDevelopment)
  drawParagraph('Key Areas of Responsibility', data.keyAreasOfResponsibility)
  drawParagraph('Other issues', data.otherIssues)
  drawText(`Annual Leave - Taken: ${data.annualLeaveTaken || ''}`)
  drawText(`Annual Leave - Booked: ${data.annualLeaveBooked || ''}`)
  addSpacer(10)

  // Service Users
  drawText('Service Users', { bold: true, size: 13 })
  addSpacer(4)
  drawKeyVal('Count', String(data.serviceUsersCount || 0))
  const names = (data.serviceUserNames || []).filter(Boolean)
  if (names.length) drawParagraph('Names', names.join(', '))

  ;(data.perServiceUser || []).forEach((su, idx) => {
    addSpacer(8)
    drawText(`Service User #${idx + 1}: ${su.serviceUserName || ''}`, { bold: true })
    const yesNo = (o?: { value?: 'yes'|'no'; reason?: string }) => `${o?.value || ''}${o?.reason ? ` - ${o.reason}` : ''}`
    drawText(`Concerns: ${yesNo(su.concerns)}`)
    drawText(`Comfortable working: ${yesNo(su.comfortable)}`)
    drawText(`Comments about service: ${yesNo(su.commentsAboutService)}`)
    drawText(`Complaints made: ${yesNo(su.complaintsByServiceUser)}`)
    drawText(`Safeguarding issues: ${yesNo(su.safeguardingIssues)}`)
    drawText(`Other discussion: ${yesNo(su.otherDiscussion)}`)
    drawText(`Bruises: ${yesNo(su.bruises)}`)
    if (su.bruises?.value === 'yes' && su.bruisesCauses) drawText(`Bruises causes: ${su.bruisesCauses}`)
    drawText(`Pressure sores: ${yesNo(su.pressureSores)}`)
  })

  addSpacer(10)
  // Office Use
  drawText('For Office Use Only', { bold: true, size: 13 })
  addSpacer(4)
  drawKeyVal('Name of employee', data.office?.employeeName)
  drawKeyVal('Project', data.office?.project)
  drawKeyVal('Supervisor', data.office?.supervisor)
  drawKeyVal('Date', data.office?.date)
  addSpacer(4)
  for (const a of data.office?.actions || []) {
    if (!a.issue && !a.action && !a.byWhom && !a.dateCompleted) continue
    drawText('Action Item', { bold: true })
    drawKeyVal('Issue', a.issue)
    drawKeyVal('Action', a.action)
    drawKeyVal('By Whom', a.byWhom)
    drawKeyVal('Date Completed', a.dateCompleted)
    addSpacer(4)
  }

  addSpacer(8)
  drawText('End of Report', { size: 10 })

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
