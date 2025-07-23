import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { JobApplicationData, PersonalInfo, Availability, EmergencyContact, EmploymentHistory, References, SkillsExperience, Declaration, TermsPolicy } from './types';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { EmergencyContactStep } from './steps/EmergencyContactStep';
import { EmploymentHistoryStep } from './steps/EmploymentHistoryStep';
import { ReferencesStep } from './steps/ReferencesStep';
import { SkillsExperienceStep } from './steps/SkillsExperienceStep';
import { DeclarationStep } from './steps/DeclarationStep';
import { TermsPolicyStep } from './steps/TermsPolicyStep';

const initialFormData: JobApplicationData = {
  personalInfo: {
    title: '',
    fullName: '',
    email: '',
    confirmEmail: '',
    telephone: '',
    dateOfBirth: '',
    streetAddress: '',
    streetAddress2: '',
    town: '',
    borough: '',
    postcode: '',
    englishProficiency: '',
    otherLanguages: [],
    positionAppliedFor: '',
    hasDBS: '',
    hasCarAndLicense: '',
    nationalInsuranceNumber: '',
  },
  availability: {
    selectedShifts: [],
    hoursPerWeek: '',
    hasRightToWork: '',
  },
  emergencyContact: {
    fullName: '',
    relationship: '',
    contactNumber: '',
    howDidYouHear: '',
  },
  employmentHistory: {
    previouslyEmployed: '',
  },
  references: {
    reference1: {
      name: '', company: '', jobTitle: '', email: '', address: '', address2: '', town: '', contactNumber: '', postcode: ''
    },
    reference2: {
      name: '', company: '', jobTitle: '', email: '', address: '', address2: '', town: '', contactNumber: '', postcode: ''
    }
  },
  skillsExperience: { skills: {} },
  declaration: {
    socialServiceEnquiry: '', convictedOfOffence: '', safeguardingInvestigation: '', 
    criminalConvictions: '', healthConditions: '', cautionsReprimands: ''
  },
  termsPolicy: { consentToTerms: false, signature: '', fullName: '', date: '' }
};

export function JobApplicationPortal() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<JobApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const totalSteps = 8;

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string | string[]) => {
    setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const updateAvailability = (field: keyof Availability, value: string | string[]) => {
    setFormData(prev => ({ ...prev, availability: { ...prev.availability, [field]: value } }));
  };

  const updateEmergencyContact = (field: keyof EmergencyContact, value: string) => {
    setFormData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [field]: value } }));
  };

  const updateEmploymentHistory = (field: keyof EmploymentHistory, value: any) => {
    setFormData(prev => ({ ...prev, employmentHistory: { ...prev.employmentHistory, [field]: value } }));
  };

  const updateReferences = (field: keyof References, value: any) => {
    setFormData(prev => ({ ...prev, references: { ...prev.references, [field]: value } }));
  };

  const updateSkillsExperience = (field: keyof SkillsExperience, value: any) => {
    setFormData(prev => ({ ...prev, skillsExperience: { ...prev.skillsExperience, [field]: value } }));
  };

  const updateDeclaration = (field: keyof Declaration, value: string) => {
    setFormData(prev => ({ ...prev, declaration: { ...prev.declaration, [field]: value } }));
  };

  const updateTermsPolicy = (field: keyof TermsPolicy, value: string | boolean) => {
    setFormData(prev => ({ ...prev, termsPolicy: { ...prev.termsPolicy, [field]: value } }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          personal_info: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            dateOfBirth: formData.dateOfBirth
          },
          position_info: {
            position: formData.position,
            availableStartDate: formData.availableStartDate,
            expectedSalary: formData.expectedSalary,
            workType: formData.workType
          },
          experience: {
            previousEmployer: formData.previousEmployer,
            jobTitle: formData.jobTitle,
            workPeriod: formData.workPeriod,
            responsibilities: formData.responsibilities
          },
          skills: {
            skills: formData.skills,
            qualifications: formData.qualifications,
            languages: formData.languages
          },
          declarations: {
            eligibleToWork: formData.eligibleToWork,
            criminalRecord: formData.criminalRecord,
            references: formData.references
          },
          consent: {
            dataProcessingConsent: formData.dataProcessingConsent,
            declarationConsent: formData.declarationConsent,
            digitalSignature: formData.digitalSignature,
            signatureDate: new Date().toISOString()
          },
          status: 'new'
        }]);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully. We'll be in touch soon!",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Application Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for your interest in joining our team. We have received your application and will review it shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              You should receive a confirmation email at <strong>{formData.email}</strong> within the next few minutes.
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="position">Position Applied For *</Label>
              <Select value={formData.position} onValueChange={(value) => updateFormData('position', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software-engineer">Software Engineer</SelectItem>
                  <SelectItem value="data-analyst">Data Analyst</SelectItem>
                  <SelectItem value="project-manager">Project Manager</SelectItem>
                  <SelectItem value="sales-representative">Sales Representative</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                  <SelectItem value="marketing-specialist">Marketing Specialist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="availableStartDate">Available Start Date</Label>
              <Input
                id="availableStartDate"
                type="date"
                value={formData.availableStartDate}
                onChange={(e) => updateFormData('availableStartDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expectedSalary">Expected Salary</Label>
              <Input
                id="expectedSalary"
                value={formData.expectedSalary}
                onChange={(e) => updateFormData('expectedSalary', e.target.value)}
                placeholder="e.g., £30,000 - £35,000"
              />
            </div>
            <div>
              <Label htmlFor="workType">Preferred Work Type</Label>
              <Select value={formData.workType} onValueChange={(value) => updateFormData('workType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="previousEmployer">Previous Employer</Label>
              <Input
                id="previousEmployer"
                value={formData.previousEmployer}
                onChange={(e) => updateFormData('previousEmployer', e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => updateFormData('jobTitle', e.target.value)}
                placeholder="Your role"
              />
            </div>
            <div>
              <Label htmlFor="workPeriod">Work Period</Label>
              <Input
                id="workPeriod"
                value={formData.workPeriod}
                onChange={(e) => updateFormData('workPeriod', e.target.value)}
                placeholder="e.g., Jan 2020 - Dec 2023"
              />
            </div>
            <div>
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => updateFormData('responsibilities', e.target.value)}
                rows={4}
                placeholder="Describe your main duties and achievements"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="skills">Skills & Competencies</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => updateFormData('skills', e.target.value)}
                rows={3}
                placeholder="List your key skills, software proficiency, etc."
              />
            </div>
            <div>
              <Label htmlFor="qualifications">Qualifications & Certifications</Label>
              <Textarea
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) => updateFormData('qualifications', e.target.value)}
                rows={3}
                placeholder="Degrees, certifications, courses, etc."
              />
            </div>
            <div>
              <Label htmlFor="languages">Languages</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) => updateFormData('languages', e.target.value)}
                placeholder="e.g., English (Native), Spanish (Conversational)"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="eligibleToWork"
                  checked={formData.eligibleToWork}
                  onCheckedChange={(checked) => updateFormData('eligibleToWork', checked === true)}
                />
                <Label htmlFor="eligibleToWork" className="text-sm leading-relaxed">
                  I confirm that I am eligible to work in the UK and can provide appropriate documentation if required.
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="criminalRecord"
                  checked={formData.criminalRecord}
                  onCheckedChange={(checked) => updateFormData('criminalRecord', checked === true)}
                />
                <Label htmlFor="criminalRecord" className="text-sm leading-relaxed">
                  I declare that I have no unspent criminal convictions (or I am willing to discuss any that may be relevant to this position).
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="references">References</Label>
              <Textarea
                id="references"
                value={formData.references}
                onChange={(e) => updateFormData('references', e.target.value)}
                rows={4}
                placeholder="Please provide contact details for 2 professional references (name, position, company, email, phone)"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataProcessingConsent"
                  checked={formData.dataProcessingConsent}
                  onCheckedChange={(checked) => updateFormData('dataProcessingConsent', checked === true)}
                />
                <Label htmlFor="dataProcessingConsent" className="text-sm leading-relaxed">
                  I consent to the processing of my personal data for the purpose of this job application and recruitment process.
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="declarationConsent"
                  checked={formData.declarationConsent}
                  onCheckedChange={(checked) => updateFormData('declarationConsent', checked === true)}
                />
                <Label htmlFor="declarationConsent" className="text-sm leading-relaxed">
                  I declare that the information provided in this application is true and complete to the best of my knowledge.
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="digitalSignature">Digital Signature *</Label>
              <Input
                id="digitalSignature"
                value={formData.digitalSignature}
                onChange={(e) => updateFormData('digitalSignature', e.target.value)}
                placeholder="Type your full name as your digital signature"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                By typing your name, you are providing your digital signature for this application.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = [
      'Personal Information',
      'Position & Availability',
      'Employment History',
      'Skills & Qualifications',
      'Declarations',
      'Consent & Signature'
    ];
    return titles[currentStep - 1];
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.position;
      case 6:
        return formData.dataProcessingConsent && formData.declarationConsent && formData.digitalSignature;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Job Application</h1>
            <p className="text-muted-foreground">Step {currentStep} of {totalSteps}: {getStepTitle()}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/20 rounded-full h-2 mb-8">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}