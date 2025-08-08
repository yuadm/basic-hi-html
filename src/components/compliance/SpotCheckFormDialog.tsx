import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";

export interface SpotCheckObservation {
  id: string;
  label: string;
  value?: "yes" | "no";
  comments?: string;
}

export interface SpotCheckFormData {
  serviceUserName: string;
  careWorker1: string;
  careWorker2: string;
  date: string; // yyyy-MM-dd
  timeFrom: string; // HH:mm
  timeTo: string; // HH:mm
  carriedBy: string;
  observations: SpotCheckObservation[];
}

interface SpotCheckFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SpotCheckFormData) => void;
}

export default function SpotCheckFormDialog({ open, onOpenChange, onSubmit }: SpotCheckFormDialogProps) {
  const { companySettings } = useCompany();
  const { toast } = useToast();

  const [form, setForm] = useState<SpotCheckFormData>({
    serviceUserName: "",
    careWorker1: "",
    careWorker2: "",
    date: "",
    timeFrom: "",
    timeTo: "",
    carriedBy: "",
    observations: [],
  });

  const observationItems = useMemo<SpotCheckObservation[]>(
    () => [
      { id: "arrives_on_time", label: "Care Worker arrives at the Service User's home on time" },
      { id: "keys_or_alerts", label: "Care Worker has keys for entry/Alerts the Service User upon arrival / key safe number" },
      { id: "id_badge", label: "Care Worker is wearing a valid and current ID badge" },
      { id: "safe_hygiene_ppe", label: "Care Worker practices safe hygiene (use of PPE clothing, gloves/aprons etc.)" },
      { id: "checks_care_plan", label: "Care Worker checks Service User's care plan upon arrival" },
      { id: "equipment_used_properly", label: "Equipment (hoists etc) used properly" },
      { id: "food_safety", label: "Care Worker practices proper food safety and hygiene principles" },
      { id: "vigilant_hazards", label: "Care Worker is vigilant for hazards in the Service User's home" },
      { id: "communicates_user", label: "Care Worker communicates with the Service User (tasks to be done, maintaining confidentiality)" },
      { id: "asks_satisfaction", label: "Care Worker asks Service User if he/she is satisfied with the service" },
      { id: "daily_report_forms", label: "Care Worker completes Daily Report forms satisfactorily" },
      { id: "snacks_stored_properly", label: "Snacks left for the Service User are covered and stored properly" },
      { id: "leaves_premises_locked", label: "Care Worker leaves premises, locking doors behind him/her" },
    ],
    []
  );

  // Initialize observations on open
  React.useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        observations: observationItems.map((item) => ({ id: item.id, label: item.label })),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateField = (key: keyof SpotCheckFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateObservation = (id: string, changes: Partial<SpotCheckObservation>) => {
    setForm((prev) => ({
      ...prev,
      observations: prev.observations.map((obs) => (obs.id === id ? { ...obs, ...changes } : obs)),
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!form.serviceUserName || !form.careWorker1 || !form.date || !form.timeFrom || !form.timeTo || !form.carriedBy) {
      toast({ title: "Missing information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    for (const obs of form.observations) {
      if (!obs.value) {
        toast({ title: "Incomplete observations", description: "Please select Yes or No for all observations.", variant: "destructive" });
        return;
      }
      if (obs.value === "no" && !obs.comments?.trim()) {
        toast({ title: "Comments required", description: "Provide comments for all 'No' responses.", variant: "destructive" });
        return;
      }
    }

    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Spot Check</DialogTitle>
          <DialogDescription>Fill out the spot check form below</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Logo */}
          {companySettings?.logo && (
            <div className="flex justify-center">
              <img
                src={companySettings.logo}
                alt={`${companySettings.name || "Company"} logo`}
                className="h-12 object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Service User's Name</Label>
              <Input value={form.serviceUserName} onChange={(e) => updateField("serviceUserName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Care Worker(s) attending</Label>
              <Input value={form.careWorker1} onChange={(e) => updateField("careWorker1", e.target.value)} placeholder="Name 1" />
            </div>
            <div className="space-y-1">
              <Label>Care Worker(s) attending</Label>
              <Input value={form.careWorker2} onChange={(e) => updateField("careWorker2", e.target.value)} placeholder="Name 2 (optional)" />
            </div>
            <div className="space-y-1">
              <Label>Date of spot check</Label>
              <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Time of spot check (From)</Label>
              <Input type="time" value={form.timeFrom} onChange={(e) => updateField("timeFrom", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Time of spot check (To)</Label>
              <Input type="time" value={form.timeTo} onChange={(e) => updateField("timeTo", e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Spot Check carried out by</Label>
              <Input value={form.carriedBy} onChange={(e) => updateField("carriedBy", e.target.value)} />
            </div>
          </div>

          {/* Observation section */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">B: OBSERVATION</h3>
            {/* Desktop/tablet grid */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm">
              <div className="col-span-6 font-medium">Item</div>
              <div className="col-span-2 font-medium">Yes</div>
              <div className="col-span-2 font-medium">No</div>
              <div className="col-span-2 font-medium">Observation/comments</div>

              {observationItems.map((item) => {
                const current = form.observations.find((o) => o.id === item.id);
                return (
                  <React.Fragment key={item.id}>
                    <div className="col-span-6 py-2">{item.label}</div>
                    <div className="col-span-2 py-2">
                      <input
                        type="radio"
                        name={`obs-${item.id}`}
                        checked={current?.value === "yes"}
                        onChange={() => updateObservation(item.id, { value: "yes", comments: current?.comments })}
                        aria-label={`${item.label} - Yes`}
                      />
                    </div>
                    <div className="col-span-2 py-2">
                      <input
                        type="radio"
                        name={`obs-${item.id}`}
                        checked={current?.value === "no"}
                        onChange={() => updateObservation(item.id, { value: "no" })}
                        aria-label={`${item.label} - No`}
                      />
                    </div>
                    <div className="col-span-2 py-1">
                      <Input
                        disabled={current?.value !== "no"}
                        placeholder={current?.value === "no" ? "Required for 'No'" : "Optional"}
                        value={current?.comments || ""}
                        onChange={(e) => updateObservation(item.id, { comments: e.target.value })}
                      />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-3">
              {observationItems.map((item) => {
                const current = form.observations.find((o) => o.id === item.id);
                return (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`obs-mobile-${item.id}`}
                          checked={current?.value === "yes"}
                          onChange={() => updateObservation(item.id, { value: "yes", comments: current?.comments })}
                          aria-label={`${item.label} - Yes`}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={`obs-mobile-${item.id}`}
                          checked={current?.value === "no"}
                          onChange={() => updateObservation(item.id, { value: "no" })}
                          aria-label={`${item.label} - No`}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    <Input
                      disabled={current?.value !== "no"}
                      placeholder={current?.value === "no" ? "Required for 'No'" : "Optional"}
                      value={current?.comments || ""}
                      onChange={(e) => updateObservation(item.id, { comments: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Spot Check</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
