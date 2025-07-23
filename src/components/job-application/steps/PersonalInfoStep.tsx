import { PersonalInfo } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface PersonalInfoStepProps {
  data: PersonalInfo;
  updateData: (field: keyof PersonalInfo, value: string | string[]) => void;
}

const titles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'];
const boroughs = ['Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets', 'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth', 'Hammersmith and Fulham', 'Kensington and Chelsea', 'Other'];
const englishLevels = ['Native', 'Fluent', 'Intermediate', 'Basic'];
const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Mandarin', 'Hindi', 'Polish', 'Romanian', 'Other'];
const positions = ['Care Assistant', 'Senior Care Assistant', 'Care Coordinator', 'Registered Nurse', 'Activities Coordinator', 'Kitchen Assistant', 'Domestic Assistant', 'Other'];

export function PersonalInfoStep({ data, updateData }: PersonalInfoStepProps) {
  const handleLanguageToggle = (language: string, checked: boolean) => {
    const currentLanguages = data.otherLanguages || [];
    if (checked) {
      updateData('otherLanguages', [...currentLanguages, language]);
    } else {
      updateData('otherLanguages', currentLanguages.filter(l => l !== language));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <p className="text-muted-foreground mb-6">Fill your personal information and continue to the next step.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Select value={data.title} onValueChange={(value) => updateData('title', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Title" />
            </SelectTrigger>
            <SelectContent>
              {titles.map(title => (
                <SelectItem key={title} value={title}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData('email', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="confirmEmail">Confirm Email *</Label>
          <Input
            id="confirmEmail"
            type="email"
            value={data.confirmEmail}
            onChange={(e) => updateData('confirmEmail', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="telephone">Telephone/Mobile *</Label>
          <Input
            id="telephone"
            value={data.telephone}
            onChange={(e) => updateData('telephone', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => updateData('dateOfBirth', e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="streetAddress">Street Address *</Label>
          <Input
            id="streetAddress"
            value={data.streetAddress}
            onChange={(e) => updateData('streetAddress', e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="streetAddress2">Street Address Second Line</Label>
          <Input
            id="streetAddress2"
            value={data.streetAddress2}
            onChange={(e) => updateData('streetAddress2', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="town">Town *</Label>
          <Input
            id="town"
            value={data.town}
            onChange={(e) => updateData('town', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="borough">Borough *</Label>
          <Select value={data.borough} onValueChange={(value) => updateData('borough', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {boroughs.map(borough => (
                <SelectItem key={borough} value={borough}>{borough}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={data.postcode}
            onChange={(e) => updateData('postcode', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="englishProficiency">Proficiency in English (if not first language) *</Label>
          <Select value={data.englishProficiency} onValueChange={(value) => updateData('englishProficiency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {englishLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="positionAppliedFor">Position applied for *</Label>
          <Select value={data.positionAppliedFor} onValueChange={(value) => updateData('positionAppliedFor', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {positions.map(position => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hasDBS">Do you have a recent or updated DBS? *</Label>
          <Select value={data.hasDBS} onValueChange={(value) => updateData('hasDBS', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hasCarAndLicense">Do you currently have your own car and licence? *</Label>
          <Select value={data.hasCarAndLicense} onValueChange={(value) => updateData('hasCarAndLicense', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="nationalInsuranceNumber">National Insurance Number *</Label>
          <Input
            id="nationalInsuranceNumber"
            value={data.nationalInsuranceNumber}
            onChange={(e) => updateData('nationalInsuranceNumber', e.target.value)}
            placeholder="AB123456C"
            required
          />
        </div>
      </div>

      <div>
        <Label>Which other languages do you speak? *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {languages.map(language => (
            <div key={language} className="flex items-center space-x-2">
              <Checkbox
                id={language}
                checked={data.otherLanguages?.includes(language) || false}
                onCheckedChange={(checked) => handleLanguageToggle(language, checked === true)}
              />
              <Label htmlFor={language} className="text-sm">{language}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}