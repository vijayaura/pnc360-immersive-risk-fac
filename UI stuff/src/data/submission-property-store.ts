import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { mockProperties, type Property } from "./mock-properties";
import type { Json } from "@/integrations/supabase/types";

export interface EmailPropertySource {
  emailId: string;
  subject: string;
  from: string;
  date: string;
}

export function getEmailPropertyId(emailId: string) {
  const safeId = emailId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 56);
  return `email-${safeId || crypto.randomUUID()}`;
}

export function useSubmissionProperties() {
  const { user } = useAuth();
  const [emailProperties, setEmailProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setEmailProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("submission_properties")
      .select("property_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setEmailProperties((data || []).map((row) => row.property_data as unknown as Property));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveEmailProperty = useCallback(
    async (property: Property, source: EmailPropertySource) => {
      if (!user) return { property: null, error: "You must be signed in to save a submission." };

      const { data, error } = await supabase
        .from("submission_properties")
        .upsert(
          {
            id: property.id,
            user_id: user.id,
            property_data: property as unknown as Json,
            source: "email",
            source_email_id: source.emailId,
            source_subject: source.subject,
            source_from: source.from,
            source_date: source.date,
          },
          { onConflict: "user_id,source_email_id" }
        )
        .select("property_data")
        .single();

      if (error) return { property: null, error: error.message };

      const savedProperty = (data?.property_data as unknown as Property) || property;
      setEmailProperties((prev) => [savedProperty, ...prev.filter((item) => item.id !== savedProperty.id)]);
      return { property: savedProperty, error: null };
    },
    [user]
  );

  const properties = useMemo(() => [...emailProperties, ...mockProperties], [emailProperties]);

  return { properties, emailProperties, loading, refresh, saveEmailProperty };
}