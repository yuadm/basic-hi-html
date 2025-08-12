import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_SUPERVISION_QUESTIONS,
  SupervisionQuestion,
  SupervisionQuestionsConfig,
  saveSupervisionQuestions,
  useSupervisionQuestions,
} from "@/lib/supervision-questions";
import { Plus, Save, Trash2 } from "lucide-react";

export function SupervisionQuestionSettings() {
  const { config, setConfig, loading } = useSupervisionQuestions();
  const { toast } = useToast();

  const [working, setWorking] = useState(false);

  const updateDefault = (id: string, patch: Partial<SupervisionQuestion>) => {
    setConfig((prev) => ({
      ...prev,
      defaults: prev.defaults.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const addCustom = () => {
    const id = `custom_${Date.now()}`;
    const item: SupervisionQuestion = { id, label: "New question", enabled: true, required: false };
    setConfig((prev) => ({ ...prev, custom: [...prev.custom, item] }));
  };

  const updateCustom = (id: string, patch: Partial<SupervisionQuestion>) => {
    setConfig((prev) => ({
      ...prev,
      custom: prev.custom.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const removeCustom = (id: string) => {
    setConfig((prev) => ({ ...prev, custom: prev.custom.filter((q) => q.id !== id) }));
  };

  const resetDefaults = () => {
    setConfig((prev) => ({ ...prev, defaults: DEFAULT_SUPERVISION_QUESTIONS.defaults }));
  };

  const handleSave = async () => {
    try {
      setWorking(true);
      const payload: SupervisionQuestionsConfig = { version: 1, defaults: config.defaults, custom: config.custom };
      await saveSupervisionQuestions(payload);
      toast({ title: "Saved", description: "Supervision questions updated" });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <div>Loading supervision questions…</div>;

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle>Supervision Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium">Default Questions</h4>
          <p className="text-sm text-muted-foreground">Enable/disable, rename, or mark required. These map to the built-in per service user questions.</p>
          <div className="space-y-3">
            {config.defaults.map((q) => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border rounded-md p-3">
                <div className="md:col-span-7 space-y-1">
                  <Label>Label</Label>
                  <Input value={q.label} onChange={(e) => updateDefault(q.id, { label: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!q.enabled} onCheckedChange={(v) => updateDefault(q.id, { enabled: v })} />
                    <span className="text-sm">Enabled</span>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!q.required} onCheckedChange={(v) => updateDefault(q.id, { required: v })} />
                    <span className="text-sm">Required</span>
                  </div>
                </div>
                <div className="md:col-span-1 text-right text-xs text-muted-foreground">{q.id}</div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={resetDefaults}>Reset to defaults</Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Custom Questions</h4>
              <p className="text-sm text-muted-foreground">Add your own per service user questions. They will appear in the form and PDF.</p>
            </div>
            <Button type="button" variant="secondary" onClick={addCustom}>
              <Plus className="w-4 h-4 mr-2" /> Add custom
            </Button>
          </div>
          <div className="space-y-3">
            {config.custom.length === 0 && (
              <div className="text-sm text-muted-foreground">No custom questions added.</div>
            )}
            {config.custom.map((q) => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border rounded-md p-3">
                <div className="md:col-span-7 space-y-1">
                  <Label>Label</Label>
                  <Input value={q.label} onChange={(e) => updateCustom(q.id, { label: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!q.enabled} onCheckedChange={(v) => updateCustom(q.id, { enabled: v })} />
                    <span className="text-sm">Enabled</span>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!q.required} onCheckedChange={(v) => updateCustom(q.id, { required: v })} />
                    <span className="text-sm">Required</span>
                  </div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button type="button" variant="outline" size="icon" onClick={() => removeCustom(q.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={working} className="bg-gradient-primary">
            <Save className="w-4 h-4 mr-2" /> Save Questions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
