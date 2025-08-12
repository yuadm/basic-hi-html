import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type YesNo = "yes" | "no";

export interface SupervisionQuestion {
  id: string; // stable id used as key
  label: string;
  enabled: boolean;
  required?: boolean;
  isDefault?: boolean; // true if it maps to a built-in field
}

export interface SupervisionQuestionsConfig {
  version: 1;
  // Default questions (map to built-in fields in the form & PDF)
  defaults: SupervisionQuestion[];
  // Custom questions (saved under per-user custom responses)
  custom: SupervisionQuestion[];
}

export const DEFAULT_SUPERVISION_QUESTIONS: SupervisionQuestionsConfig = {
  version: 1,
  defaults: [
    { id: "concerns", label: "Are there any concerns you have regarding this service user?", enabled: true, required: false, isDefault: true },
    { id: "comfortable", label: "Are you comfortable working with this service user?", enabled: true, required: false, isDefault: true },
    { id: "commentsAboutService", label: "Any comments the service user made regarding the service by you, other carers or the agency?", enabled: true, required: false, isDefault: true },
    { id: "complaintsByServiceUser", label: "Any complaint the service user made regarding the service by you, other carers or the agency?", enabled: true, required: false, isDefault: true },
    { id: "safeguardingIssues", label: "Have you noticed any safeguarding issues with this client?", enabled: true, required: false, isDefault: true },
    { id: "otherDiscussion", label: "Is there anything else you want to discuss?", enabled: true, required: false, isDefault: true },
    { id: "bruises", label: "Are there any bruises with service user?", enabled: true, required: false, isDefault: true },
    { id: "pressureSores", label: "Are there any pressure sores with service user?", enabled: true, required: false, isDefault: true },
  ],
  custom: [],
};

const SETTING_KEY = "supervision_questions_v1";

export async function loadSupervisionQuestions(): Promise<SupervisionQuestionsConfig> {
  const { data, error } = await supabase
    .from("application_reference_settings")
    .select("setting_value")
    .eq("setting_key", SETTING_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) {
    return DEFAULT_SUPERVISION_QUESTIONS;
  }

  try {
    const cfg = (data.setting_value as unknown) as SupervisionQuestionsConfig;
    if (cfg && cfg.version === 1) return cfg;
    return DEFAULT_SUPERVISION_QUESTIONS;
  } catch {
    return DEFAULT_SUPERVISION_QUESTIONS;
  }
}

export async function saveSupervisionQuestions(cfg: SupervisionQuestionsConfig) {
  // Upsert by key
  const { error } = await supabase.from("application_reference_settings").upsert(
    [{ setting_key: SETTING_KEY, setting_value: (cfg as unknown) as any }],
    { onConflict: "setting_key" }
  );
  if (error) throw error;
}

export function useSupervisionQuestions() {
  const [config, setConfig] = useState<SupervisionQuestionsConfig>(DEFAULT_SUPERVISION_QUESTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await loadSupervisionQuestions();
        if (mounted) setConfig(cfg);
      } catch (e: any) {
        setError(e?.message || "Failed to load supervision questions");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return { config, setConfig, loading, error };
}
