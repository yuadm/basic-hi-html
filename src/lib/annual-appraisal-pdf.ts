import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnnualAppraisalFormData } from '@/components/compliance/AnnualAppraisalFormDialog';

export const generateAnnualAppraisalPDF = async (data: AnnualAppraisalFormData, employeeName: string = '', companyName: string = 'Company Name') => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Add company logo placeholder
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, margin, 25);
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANNUAL APPRAISAL FORM', pageWidth / 2, 40, { align: 'center' });
  
  let currentY = 60;
  
  // Employee Information Section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMPLOYEE INFORMATION', margin, currentY);
  currentY += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Employee Name: ${employeeName}`, margin, currentY);
  currentY += 8;
  pdf.text(`Job Title: ${data.job_title}`, margin, currentY);
  currentY += 8;
  pdf.text(`Date of Appraisal: ${data.appraisal_date}`, margin, currentY);
  currentY += 20;
  
  // Performance Assessment Section
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERFORMANCE ASSESSMENT', margin, currentY);
  currentY += 15;
  
  const performanceQuestions = [
    { key: 'clientCare', label: 'Client Care' },
    { key: 'careStandards', label: 'Knowledge of Care Standards' },
    { key: 'safetyHealth', label: 'Safety and Health Compliance' },
    { key: 'medicationManagement', label: 'Medication Management' },
    { key: 'communication', label: 'Communication with Clients & Team' },
    { key: 'responsiveness', label: 'Responsiveness and Adaptability' },
    { key: 'professionalDevelopment', label: 'Professional Development' },
    { key: 'attendance', label: 'Attendance & Punctuality' }
  ];
  
  pdf.setFont('helvetica', 'normal');
  performanceQuestions.forEach((question) => {
    const rating = (data.ratings as any)[question.key];
    pdf.text(`${question.label}: ${rating}`, margin, currentY);
    currentY += 8;
  });
  
  currentY += 10;
  
  // Comments Section
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMMENTS', margin, currentY);
  currentY += 10;
  
  pdf.setFont('helvetica', 'normal');
  if (data.comments_manager) {
    pdf.text('Manager Comments:', margin, currentY);
    currentY += 8;
    const managerLines = pdf.splitTextToSize(data.comments_manager, contentWidth);
    managerLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });
    currentY += 5;
  }
  
  if (data.comments_employee) {
    pdf.text('Employee Comments:', margin, currentY);
    currentY += 8;
    const employeeLines = pdf.splitTextToSize(data.comments_employee, contentWidth);
    employeeLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });
    currentY += 10;
  }
  
  // Check if we need a new page
  if (currentY > pageHeight - 80) {
    pdf.addPage();
    currentY = 20;
  }
  
  // Action Plans Section
  pdf.setFont('helvetica', 'bold');
  pdf.text('ACTION PLANS', margin, currentY);
  currentY += 15;
  
  pdf.setFont('helvetica', 'normal');
  if (data.action_training) {
    pdf.text('Actions plans agreed to develop employee and/or the job include any Training or counselling requirements:', margin, currentY);
    currentY += 8;
    const trainingLines = pdf.splitTextToSize(data.action_training, contentWidth);
    trainingLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });
    currentY += 10;
  }
  
  if (data.action_career) {
    pdf.text('Career development - possible steps in career development:', margin, currentY);
    currentY += 8;
    const careerLines = pdf.splitTextToSize(data.action_career, contentWidth);
    careerLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });
    currentY += 10;
  }
  
  if (data.action_plan) {
    pdf.text('Agreed action plan, job & development objectives, and time scale:', margin, currentY);
    currentY += 8;
    const planLines = pdf.splitTextToSize(data.action_plan, contentWidth);
    planLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });
    currentY += 15;
  }
  
  // Signatures Section
  pdf.setFont('helvetica', 'bold');
  pdf.text('SIGNATURES', margin, currentY);
  currentY += 15;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Supervisor/Manager: ${data.signature_manager}`, margin, currentY);
  currentY += 10;
  pdf.text(`Employee: ${data.signature_employee}`, margin, currentY);
  currentY += 10;
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, currentY);
  
  // Footer
  pdf.setFontSize(8);
  pdf.text('This document is confidential and should be stored securely.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  return pdf;
};

export const downloadAnnualAppraisalPDF = async (data: AnnualAppraisalFormData, employeeName: string = '', companyName: string = 'Company Name') => {
  const pdf = await generateAnnualAppraisalPDF(data, employeeName, companyName);
  const fileName = `Annual_Appraisal_${employeeName.replace(/\s+/g, '_')}_${data.appraisal_date}.pdf`;
  pdf.save(fileName);
};