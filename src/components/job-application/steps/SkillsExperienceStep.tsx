import { SkillsExperience } from '../types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SkillsExperienceStepProps {
  data: SkillsExperience;
  updateData: (field: keyof SkillsExperience, value: Record<string, 'Good' | 'Basic' | 'None'>) => void;
}

const skillsList = [
  'ADHD',
  'Administration of medicine',
  'Alzheimers',
  'Assisting with immobility',
  'Autism',
  'Cancer care',
  'Catheter care',
  'Cerebral Palsy',
  'Challenging behaviour',
  'Dementia care',
  'Diabetes',
  'Down\' syndrome',
  'Frail elderly',
  'Hoists',
  'Incontinence',
  'Learning disabilities',
  'Lewy-Body dementia',
  'Mental health',
  'Multiple sclerosis',
  'Parkinson\'s disease',
  'Special need children',
  'Stroke care',
  'Terminally III',
  'Tube feeding',
];

export function SkillsExperienceStep({ data, updateData }: SkillsExperienceStepProps) {
  const handleSkillChange = (skill: string, level: 'Good' | 'Basic' | 'None') => {
    updateData('skills', { ...data.skills, [skill]: level });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Skills & Experience</h3>
        <p className="text-muted-foreground mb-6">Please indicate if you have skills and experience in the following areas.</p>
      </div>

      <div className="space-y-4">
        {skillsList.map(skill => (
          <Card key={skill} className="border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Label className="font-medium text-sm flex-1">{skill}</Label>
                <div className="flex gap-2">
                  {(['Good', 'Basic', 'None'] as const).map(level => (
                    <Button
                      key={level}
                      variant={data.skills?.[skill] === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSkillChange(skill, level)}
                      className="min-w-[60px]"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}