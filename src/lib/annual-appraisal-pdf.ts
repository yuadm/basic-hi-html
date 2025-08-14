import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import DejaVuSansRegularUrl from '@/assets/fonts/dejavu/DejaVuSans.ttf'
import DejaVuSansBoldUrl from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf'
import { format } from 'date-fns'
import type { AnnualAppraisalFormData } from '@/components/compliance/AnnualAppraisalFormDialog';

interface CompanyInfo {
  name?: string
  logo?: string
}

export async function generateAnnualAppraisalPDF(data: AnnualAppraisalFormData, employeeName: string = '', company?: CompanyInfo) {
  console.log('Generating Annual Appraisal PDF with data:', data);
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
  const accent = rgb(0.2, 0.55, 0.95)
  const sectionBg = rgb(0.96, 0.97, 0.99)

  // Page state
  let page = doc.addPage()
  let y = page.getHeight() - marginTop
  let pageIndex = 1

  // Date formatter (dd/MM/yyyy)
  const formatDateDmy = (s?: string) => {
    if (!s) return ''
    const d = new Date(s)
    return isNaN(d.getTime()) ? s : format(d, 'dd/MM/yyyy')
  }

  const drawHeader = () => {
    const headerHeight = embeddedLogo ? 140 : 120
    // Header background
    page.drawRectangle({ x: 0, y: page.getHeight() - headerHeight, width: page.getWidth(), height: headerHeight, color: rgb(0.98, 0.98, 0.985) })

    const centerX = page.getWidth() / 2
    let cursorY = page.getHeight() - 16

    // Logo (centered)
    if (embeddedLogo) {
      const logoW = 72
      const logoH = (embeddedLogo.height / embeddedLogo.width) * logoW
      const logoX = centerX - logoW / 2
      const logoY = page.getHeight() - headerHeight + headerHeight - logoH - 8
      page.drawImage(embeddedLogo, { x: logoX, y: logoY, width: logoW, height: logoH })
      cursorY = logoY - 6
    }

    // Company name (centered)
    const companyName = company?.name || 'Company'
    const companySize = 13
    const companyWidth = boldFont.widthOfTextAtSize(companyName, companySize)
    page.drawText(companyName, { x: centerX - companyWidth / 2, y: cursorY - companySize, size: companySize, font: boldFont, color: textColor })
    cursorY -= companySize + 2

    // Report title (centered)
    const title = 'Annual Appraisal Report'
    const titleSize = 12
    const titleWidth = boldFont.widthOfTextAtSize(title, titleSize)
    page.drawText(title, { x: centerX - titleWidth / 2, y: cursorY - titleSize - 2, size: titleSize, font: boldFont, color: textColor })
    cursorY -= titleSize + 8

    // Year (centered)
    const d = data?.appraisal_date ? new Date(data.appraisal_date) : new Date()
    const yearText = d.getFullYear().toString()
    const yearSize = 11
    const yearWidth = font.widthOfTextAtSize(yearText, yearSize)
    page.drawText(yearText, { x: centerX - yearWidth / 2, y: cursorY - yearSize, size: yearSize, font, color: subtle })

    // Divider
    page.drawRectangle({ x: marginX, y: page.getHeight() - headerHeight - 1, width: page.getWidth() - marginX * 2, height: 1, color: accent })

    // Reset content Y just below header
    y = page.getHeight() - headerHeight - 16
  }

  const drawFooter = () => {
    const footerY = marginBottom - 24
    page.drawRectangle({ x: marginX, y: footerY + 12, width: page.getWidth() - marginX * 2, height: 1, color: divider })
    const footerText = `Page ${pageIndex}`
    page.drawText(footerText, { x: marginX, y: footerY, size: 10, font, color: subtle })
  }

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
      ensureSpace(lineHeight)
      page.drawText(lines[i], { x: marginX + labelWidth, y: y - lineHeight, size: labelSize, font, color: textColor })
      y -= lineHeight
    }
  }

  // Initialize first page header
  drawHeader()

  // Employee Information Section
  drawSectionTitle('Employee Information')
  drawKeyVal('Employee Name', employeeName)
  drawKeyVal('Job Title', data.job_title)
  drawKeyVal('Date of Appraisal', formatDateDmy(data.appraisal_date))
  drawDivider()

  // Performance Assessment Section
  drawSectionTitle('Performance Assessment')
  
  const performanceQuestions = [
    { 
      key: 'clientCare', 
      title: 'Client Care – How effective is the employee in providing care to clients?',
      options: [
        { value: "A", label: "A: Provides exceptional care, exceeding client expectations" },
        { value: "B", label: "B: Provides good quality care, meeting most client needs" },
        { value: "C", label: "C: Provides satisfactory care, meeting basic client needs" },
        { value: "D", label: "D: Inconsistent in providing adequate care" },
        { value: "E", label: "E: Unsatisfactory care, immediate action required" },
      ]
    },
    { 
      key: 'careStandards', 
      title: 'Knowledge of Care Standards – How well does the employee adhere to policies?',
      options: [
        { value: "A", label: "A: Demonstrates excellent understanding and adherence" },
        { value: "B", label: "B: Generally follows care standards with minor lapses" },
        { value: "C", label: "C: Adequate understanding of care standards, some areas unclear" },
        { value: "D", label: "D: Limited understanding, further training required" },
        { value: "E", label: "E: Poor adherence to care standards, immediate improvement needed" },
      ]
    },
    { 
      key: 'safetyHealth', 
      title: 'Safety and Health Compliance – How consistently does the employee follow safety and health guidelines?',
      options: [
        { value: "A", label: "A: Always follows guidelines, ensuring client and personal safety" },
        { value: "B", label: "B: Generally safe practices with minor lapses" },
        { value: "C", label: "C: Adequate safety practices, occasional reminders needed" },
        { value: "D", label: "D: Frequently neglects safety and health guidelines" },
        { value: "E", label: "E: Disregards safety and health guidelines, immediate action required" },
      ]
    },
    { 
      key: 'medicationManagement', 
      title: 'Medication Management – How effectively does the employee manage and administer medication?',
      options: [
        { value: "A", label: "A: Flawless in medication management and administration" },
        { value: "B", label: "B: Good medication management with minor errors" },
        { value: "C", label: "C: Adequate medication management, some errors" },
        { value: "D", label: "D: Frequent errors in medication management, further training required" },
        { value: "E", label: "E: Consistent errors in medication management, immediate action required" },
      ]
    },
    { 
      key: 'communication', 
      title: 'Communication with Clients & Team – How effective is the employee in communicating with clients and team?',
      options: [
        { value: "A", label: "A: Consistently clear and respectful communication" },
        { value: "B", label: "B: Generally good communication with minor misunderstandings" },
        { value: "C", label: "C: Adequate communication skills" },
        { value: "D", label: "D: Poor communication skills, leading to misunderstandings and issues" },
        { value: "E", label: "E: Ineffective communication, immediate improvement needed" },
      ]
    },
    { 
      key: 'responsiveness', 
      title: 'Responsiveness and Adaptability – How well does the employee adapt to changing client needs and situations?',
      options: [
        { value: "A", label: "A: Quickly and effectively adapts" },
        { value: "B", label: "B: Adequately responsive with minor delays" },
        { value: "C", label: "C: Satisfactory responsiveness but slow to adapt" },
        { value: "D", label: "D: Struggles with responsiveness and adaptability" },
        { value: "E", label: "E: Unable to adapt to changing situations, immediate action required" },
      ]
    },
    { 
      key: 'professionalDevelopment', 
      title: 'Professional Development – How actively does the employee engage in professional development?',
      options: [
        { value: "A", label: "A: Actively seeks and engages in opportunities" },
        { value: "B", label: "B: Participates in professional development" },
        { value: "C", label: "C: Occasionally engages in professional development" },
        { value: "D", label: "D: Rarely engages in professional development opportunities" },
        { value: "E", label: "E: Does not engage in professional development" },
      ]
    },
    { 
      key: 'attendance', 
      title: 'Attendance & Punctuality - What is the employee\'s pattern of absence and punctuality?',
      options: [
        { value: "A", label: "A: Always punctual, rarely absent" },
        { value: "B", label: "B: Generally punctual with acceptable attendance" },
        { value: "C", label: "C: Occasional lateness or absence" },
        { value: "D", label: "D: Frequent lateness or absences, attention required" },
        { value: "E", label: "E: Consistently late and/or absent, immediate action required" },
      ]
    }
  ];

  performanceQuestions.forEach((question) => {
    const selectedRating = (data.ratings as any)[question.key];
    const selectedOption = question.options.find(opt => opt.value === selectedRating);
    
    ensureSpace(80);
    
    // Question title
    const titleLines = wrapText(question.title, contentWidth(), boldFont, 11);
    for (const titleLine of titleLines) {
      ensureSpace(lineHeight);
      page.drawText(titleLine, { x: marginX, y: y - lineHeight, size: 11, font: boldFont, color: textColor });
      y -= lineHeight;
    }
    y -= 4;
    
    // Selected answer
    if (selectedOption) {
      const answerLines = wrapText(selectedOption.label, contentWidth() - 20, font, 11);
      for (const answerLine of answerLines) {
        ensureSpace(lineHeight);
        page.drawText(answerLine, { x: marginX + 20, y: y - lineHeight, size: 11, font, color: rgb(0.2, 0.6, 0.3) });
        y -= lineHeight;
      }
    }
    y -= 12;
  });

  // Comments Section
  drawSectionTitle('Comments')
  
  const drawParagraph = (title: string, content?: string) => {
    if (!content) return
    ensureSpace(lineHeight + 10)
    page.drawText(title, { x: marginX, y: y - lineHeight, size: 11, font: boldFont, color: textColor })
    y -= lineHeight + 4
    const lines = wrapText(content, contentWidth())
    for (const l of lines) {
      ensureSpace(lineHeight)
      page.drawText(l, { x: marginX, y: y - lineHeight, size: 11, font, color: textColor })
      y -= lineHeight
    }
    y -= 8
  }

  drawParagraph('Manager Comments:', data.comments_manager)
  drawParagraph('Employee Comments:', data.comments_employee)
  
  drawDivider()
  
  // Action Plans Section
  drawSectionTitle('Action Plans')
  drawParagraph('Actions plans agreed to develop employee and/or the job include any Training or counselling requirements:', data.action_training)
  drawParagraph('Career development - possible steps in career development:', data.action_career)
  drawParagraph('Agreed action plan, job & development objectives, and time scale:', data.action_plan)
  
  drawDivider()
  
  // Signatures Section
  drawSectionTitle('Signatures')
  drawKeyVal('Supervisor/Manager', data.signature_manager)
  drawKeyVal('Employee', data.signature_employee)
  drawKeyVal('Date', formatDateDmy(new Date().toISOString()))

  // Final footer
  drawFooter()

  // Save & download
  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const filename = `Annual_Appraisal_${(employeeName || 'Employee').replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const downloadAnnualAppraisalPDF = async (data: AnnualAppraisalFormData, employeeName: string = '', company?: CompanyInfo) => {
  await generateAnnualAppraisalPDF(data, employeeName, company);
};