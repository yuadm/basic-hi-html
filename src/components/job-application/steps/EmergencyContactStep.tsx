import { EmergencyContact } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmergencyContactStepProps {
  data: EmergencyContact;
  updateData: (field: keyof EmergencyContact, value: string) => void;
}

const relationships = ['Parent', 'Spouse', 'Partner', 'Sibling', 'Friend', 'Other Family Member', 'Other'];
const hearAboutUs = ['Job Website', 'Social Media', 'Friend/Family', 'Local Advertisement', 'Recruitment Agency', 'Walk-in', 'Other'];

export function EmergencyContactStep({ data, updateData }: EmergencyContactStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <p className="text-muted-foreground mb-6">Please provide details of someone we can contact in case of emergency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyFullName">Full Name *</Label>
          <Input
            id="emergencyFullName"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            placeholder="Full Name"
            required
          />
        </div>

        <div>
          <Label htmlFor="relationship">Relationship *</Label>
          <Select value={data.relationship} onValueChange={(value) => updateData('relationship', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent>
              {relationships.map(relationship => (
                <SelectItem key={relationship} value={relationship}>{relationship}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="emergencyContactNumber">Contact number *</Label>
          <Input
            id="emergencyContactNumber"
            value={data.contactNumber}
            onChange={(e) => updateData('contactNumber', e.target.value)}
            placeholder="Contact number"
            required
          />
        </div>

        <div>
          <Label htmlFor="howDidYouHear">How did you Hear about us? *</Label>
          <Select value={data.howDidYouHear} onValueChange={(value) => updateData('howDidYouHear', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {hearAboutUs.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}