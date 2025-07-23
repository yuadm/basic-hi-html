import { Availability } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface AvailabilityStepProps {
  data: Availability;
  updateData: (field: keyof Availability, value: string | string[]) => void;
}

const shifts = [
  { id: 'early-mornings', label: 'Early Mornings', time: '7:00 am - 10:00 am' },
  { id: 'late-mornings', label: 'Late Mornings', time: '10:00 am - 12:00 pm' },
  { id: 'early-afternoons', label: 'Early Afternoons', time: '12:00 pm - 3:00 pm' },
  { id: 'late-afternoons', label: 'Late Afternoons', time: '3:00 pm - 6:00 pm' },
  { id: 'evenings', label: 'Evenings', time: '6:00 pm - 10:00 pm' },
  { id: 'waking-nights', label: 'Waking Nights', time: '8:00 pm - 8:00 am' },
  { id: 'sleeping-nights', label: 'Sleeping Nights', time: '8:00 pm - 8:00 am' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AvailabilityStep({ data, updateData }: AvailabilityStepProps) {
  const handleShiftToggle = (shiftId: string, checked: boolean) => {
    const currentShifts = data.selectedShifts || [];
    if (checked) {
      updateData('selectedShifts', [...currentShifts, shiftId]);
    } else {
      updateData('selectedShifts', currentShifts.filter(s => s !== shiftId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Availability</h3>
        <p className="text-muted-foreground mb-6">Please specify what days and time you are available to work (you may choose more than one shift pattern).</p>
      </div>

      <div>
        <Label className="text-base font-medium">Available Shifts</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {shifts.map(shift => (
            <Card key={shift.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={shift.id}
                    checked={data.selectedShifts?.includes(shift.id) || false}
                    onCheckedChange={(checked) => handleShiftToggle(shift.id, checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={shift.id} className="font-medium cursor-pointer">
                      {shift.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{shift.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hoursPerWeek">How many hours per week are you willing to work? *</Label>
          <Input
            id="hoursPerWeek"
            type="number"
            value={data.hoursPerWeek}
            onChange={(e) => updateData('hoursPerWeek', e.target.value)}
            placeholder="Hours"
            min="1"
            max="168"
            required
          />
        </div>

        <div>
          <Label htmlFor="hasRightToWork">Do you have current right to live and work in the UK? *</Label>
          <Select value={data.hasRightToWork} onValueChange={(value) => updateData('hasRightToWork', value)}>
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
      </div>
    </div>
  );
}