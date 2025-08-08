import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { format, parseISO, isValid as isValidDateFns } from 'date-fns'
import type { JobApplicationData } from '@/components/job-application/types'

// Format date to DD-MM-YYYY regardless of input (YYYY-MM-DD, ISO, etc.)
function formatDateDDMMYYYY(value?: string): string {
  if (!value) return ''
  try {
    const parsedISO = parseISO(value)
    if (isValidDateFns(parsedISO)) return format(parsedISO, 'dd-MM-yyyy')
    const d = new Date(value)
    if (!isNaN(d.getTime())) return format(d, 'dd-MM-yyyy')
  } catch {}
  return value
}

// Text writing helper with wrapping and pagination
interface WriterCtx {
  doc: PDFDocument
  page: any
  font: any
  boldFont: any
  fontSize: number
  margin: number
  y: number
  lineHeight: number
  color: { r: number; g: number; b: number }
}

function addPage(ctx: WriterCtx) {
  ctx.page = ctx.doc.addPage()
  ctx.y = ctx.page.getHeight() - ctx.margin
}

function ensureSpace(ctx: WriterCtx, requiredHeight: number) {
  if (ctx.y - requiredHeight < ctx.margin) {
    addPage(ctx)
  }
}

function drawText(ctx: WriterCtx, text: string, options?: { bold?: boolean; size?: number }) {
  const font = options?.bold ? ctx.boldFont : ctx.font
  const size = options?.size ?? ctx.fontSize
  const maxWidth = ctx.page.getWidth() - ctx.margin * 2

  const words = (text ?? '').split(/\s+/)
  let line = ''
  const lines: string[] = []

  for (const w of words) {
    const testLine = line ? `${line} ${w}` : w
    const width = font.widthOfTextAtSize(testLine, size)
    if (width > maxWidth) {
      if (line) lines.push(line)
      line = w
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)

  const blockHeight = lines.length * ctx.lineHeight
  ensureSpace(ctx, blockHeight)
  for (const l of lines) {
    ctx.page.drawText(l, {
      x: ctx.margin,
      y: ctx.y - ctx.lineHeight,
      size,
      font,
      color: rgb(ctx.color.r, ctx.color.g, ctx.color.b),
    })
    ctx.y -= ctx.lineHeight
  }
}

function addSpacer(ctx: WriterCtx, amount = 8) {
  ensureSpace(ctx, amount)
  ctx.y -= amount
}

function addSectionTitle(ctx: WriterCtx, title: string) {
  addSpacer(ctx, 4)
  drawText(ctx, title, { bold: true, size: ctx.fontSize + 2 })
  addSpacer(ctx, 4)
}

function addKeyValue(ctx: WriterCtx, label: string, value?: string) {
  drawText(ctx, `${label}: ${value ?? ''}`)
}

export async function generateJobApplicationPdf(data: JobApplicationData) {
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

  const ctx: WriterCtx = {
    doc,
    page,
    font,
    boldFont,
    fontSize: 11,
    margin: 40,
    y: page.getHeight() - 40,
    lineHeight: 16,
    color: { r: 0, g: 0, b: 0 },
  }

  // Header
  drawText(ctx, 'Job Application Summary', { bold: true, size: 16 })
  addSpacer(ctx, 6)
  drawText(ctx, `Applicant: ${data.personalInfo?.fullName ?? ''}`)
  drawText(ctx, `Position Applied For: ${data.personalInfo?.positionAppliedFor ?? ''}`)
  drawText(ctx, `Generated: ${formatDateDDMMYYYY(new Date().toISOString())}`)
  addSpacer(ctx, 10)

  // Personal Information
  addSectionTitle(ctx, '1. Personal Information')
  addKeyValue(ctx, 'Title', data.personalInfo?.title)
  addKeyValue(ctx, 'Full Name', data.personalInfo?.fullName)
  addKeyValue(ctx, 'Email', data.personalInfo?.email)
  addKeyValue(ctx, 'Telephone', data.personalInfo?.telephone)
  addKeyValue(ctx, 'Date of Birth', formatDateDDMMYYYY(data.personalInfo?.dateOfBirth))
  addKeyValue(ctx, 'Address Line 1', data.personalInfo?.streetAddress)
  addKeyValue(ctx, 'Address Line 2', data.personalInfo?.streetAddress2)
  addKeyValue(ctx, 'Town/City', data.personalInfo?.town)
  addKeyValue(ctx, 'Borough', data.personalInfo?.borough)
  addKeyValue(ctx, 'Postcode', data.personalInfo?.postcode)
  addKeyValue(ctx, 'English Proficiency', data.personalInfo?.englishProficiency)
  addKeyValue(ctx, 'Other Languages', (data.personalInfo?.otherLanguages || []).join(', '))
  addKeyValue(ctx, 'Personal Care Willingness', data.personalInfo?.personalCareWillingness)
  addKeyValue(ctx, 'DBS', data.personalInfo?.hasDBS)
  addKeyValue(ctx, 'Car & Driving License', data.personalInfo?.hasCarAndLicense)
  addKeyValue(ctx, 'National Insurance Number', data.personalInfo?.nationalInsuranceNumber)

  // Availability
  addSectionTitle(ctx, '2. Availability')
  addKeyValue(ctx, 'Hours per Week', data.availability?.hoursPerWeek)
  addKeyValue(ctx, 'Right to Work in UK', data.availability?.hasRightToWork)
  const timeSlots = data.availability?.timeSlots || {}
  const slotEntries = Object.entries(timeSlots)
  if (slotEntries.length) {
    drawText(ctx, 'Selected Time Slots:', { bold: true })
    for (const [slotId, days] of slotEntries) {
      addKeyValue(ctx, `- ${slotId}`, (days || []).join(', '))
    }
  }

  // Emergency Contact
  addSectionTitle(ctx, '3. Emergency Contact')
  addKeyValue(ctx, 'Full Name', data.emergencyContact?.fullName)
  addKeyValue(ctx, 'Relationship', data.emergencyContact?.relationship)
  addKeyValue(ctx, 'Contact Number', data.emergencyContact?.contactNumber)
  addKeyValue(ctx, 'How Did You Hear About Us', data.emergencyContact?.howDidYouHear)

  // Employment History
  addSectionTitle(ctx, '4. Employment History')
  addKeyValue(ctx, 'Previously Employed', data.employmentHistory?.previouslyEmployed)
  if (data.employmentHistory?.previouslyEmployed === 'yes') {
    const recent = data.employmentHistory?.recentEmployer as any
    if (recent) {
      drawText(ctx, 'Most Recent Employer', { bold: true })
      addKeyValue(ctx, 'Company', recent.company)
      addKeyValue(ctx, 'Name', recent.name)
      addKeyValue(ctx, 'Email', recent.email)
      addKeyValue(ctx, 'Position', recent.position)
      addKeyValue(ctx, 'Address 1', recent.address)
      addKeyValue(ctx, 'Address 2', recent.address2)
      addKeyValue(ctx, 'Town', recent.town)
      addKeyValue(ctx, 'Postcode', recent.postcode)
      addKeyValue(ctx, 'Telephone', recent.telephone)
      addKeyValue(ctx, 'From', formatDateDDMMYYYY(recent.from))
      addKeyValue(ctx, 'To', formatDateDDMMYYYY(recent.to))
      addKeyValue(ctx, 'Leaving Date', formatDateDDMMYYYY(recent.leavingDate))
      addKeyValue(ctx, 'Key Tasks', recent.keyTasks)
      addKeyValue(ctx, 'Reason For Leaving', recent.reasonForLeaving)
    }

    const prevList = data.employmentHistory?.previousEmployers || []
    if (prevList.length) {
      drawText(ctx, 'Previous Employers', { bold: true })
      prevList.forEach((emp, idx) => {
        drawText(ctx, `#${idx + 1}`, { bold: true })
        addKeyValue(ctx, 'Company', emp.company)
        addKeyValue(ctx, 'Name', emp.name)
        addKeyValue(ctx, 'Email', emp.email)
        addKeyValue(ctx, 'Position', emp.position)
        addKeyValue(ctx, 'Address 1', emp.address)
        addKeyValue(ctx, 'Address 2', emp.address2)
        addKeyValue(ctx, 'Town', emp.town)
        addKeyValue(ctx, 'Postcode', emp.postcode)
        addKeyValue(ctx, 'Telephone', emp.telephone)
        addKeyValue(ctx, 'From', formatDateDDMMYYYY(emp.from))
        addKeyValue(ctx, 'To', formatDateDDMMYYYY(emp.to))
        addKeyValue(ctx, 'Leaving Date', formatDateDDMMYYYY(emp.leavingDate))
        addKeyValue(ctx, 'Key Tasks', emp.keyTasks)
        addKeyValue(ctx, 'Reason For Leaving', emp.reasonForLeaving)
        addSpacer(ctx, 6)
      })
    }
  }

  // References (dynamic)
  addSectionTitle(ctx, '5. References')
  const refs: any[] = Object.values<any>(data.references || {})
  refs
    .filter((r) => r && (r.name || r.company || r.email))
    .forEach((ref, idx) => {
      drawText(ctx, `Reference #${idx + 1}`, { bold: true })
      addKeyValue(ctx, 'Name', ref.name)
      addKeyValue(ctx, 'Company', ref.company)
      addKeyValue(ctx, 'Job Title', ref.jobTitle)
      addKeyValue(ctx, 'Email', ref.email)
      addKeyValue(ctx, 'Contact Number', ref.contactNumber)
      addKeyValue(ctx, 'Address 1', ref.address)
      addKeyValue(ctx, 'Address 2', ref.address2)
      addKeyValue(ctx, 'Town', ref.town)
      addKeyValue(ctx, 'Postcode', ref.postcode)
      addSpacer(ctx, 6)
    })

  // Skills & Experience
  addSectionTitle(ctx, '6. Skills & Experience')
  const skills = data.skillsExperience?.skills || {}
  const skillEntries = Object.entries(skills)
  if (skillEntries.length) {
    skillEntries.forEach(([skill, level]) => {
      addKeyValue(ctx, skill, String(level))
    })
  } else {
    drawText(ctx, 'No specific skills listed')
  }

  // Declaration
  addSectionTitle(ctx, '7. Declaration')
  const dec = data.declaration
  addKeyValue(ctx, 'Social Service Enquiry', dec?.socialServiceEnquiry)
  if (dec?.socialServiceDetails) addKeyValue(ctx, 'Details', dec.socialServiceDetails)
  addKeyValue(ctx, 'Convicted of Offence', dec?.convictedOfOffence)
  if (dec?.convictedDetails) addKeyValue(ctx, 'Details', dec.convictedDetails)
  addKeyValue(ctx, 'Safeguarding Investigation', dec?.safeguardingInvestigation)
  if (dec?.safeguardingDetails) addKeyValue(ctx, 'Details', dec.safeguardingDetails)
  addKeyValue(ctx, 'Criminal Convictions', dec?.criminalConvictions)
  if (dec?.criminalDetails) addKeyValue(ctx, 'Details', dec.criminalDetails)
  addKeyValue(ctx, 'Health Conditions', dec?.healthConditions)
  if (dec?.healthDetails) addKeyValue(ctx, 'Details', dec.healthDetails)
  addKeyValue(ctx, 'Cautions / Reprimands', dec?.cautionsReprimands)
  if (dec?.cautionsDetails) addKeyValue(ctx, 'Details', dec.cautionsDetails)

  // Terms & Policy
  addSectionTitle(ctx, '8. Terms & Policy')
  addKeyValue(ctx, 'Consent to Terms', data.termsPolicy?.consentToTerms ? 'Yes' : 'No')
  addKeyValue(ctx, 'Signature (name)', data.termsPolicy?.signature)
  addKeyValue(ctx, 'Full Name', data.termsPolicy?.fullName)
  addKeyValue(ctx, 'Date', formatDateDDMMYYYY(data.termsPolicy?.date))

  // Footer note
  addSpacer(ctx, 10)
  drawText(ctx, 'This is a system-generated document based on the submitted application.', { size: 10 })

  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const name = (data.personalInfo?.fullName || 'Applicant').replace(/\s+/g, '_')
  const filename = `Job_Application_${name}_${formatDateDDMMYYYY(new Date().toISOString())}.pdf`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
