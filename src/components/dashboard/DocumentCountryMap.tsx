import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// World topojson
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryCounts = Record<string, number>;

export function DocumentCountryMap() {
  const [counts, setCounts] = useState<CountryCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("document_tracker")
          .select("country");
        if (error) throw error;
        const map: CountryCounts = {};
        (data || []).forEach((row: any) => {
          const name = (row?.country || "").trim();
          if (!name) return;
          const key = name.toLowerCase();
          map[key] = (map[key] || 0) + 1;
        });
        setCounts(map);
      } catch (e) {
        console.error("Failed to load country distribution", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const max = useMemo(() => {
    return Object.values(counts).reduce((a, b) => Math.max(a, b), 0) || 0;
  }, [counts]);

  const getFill = (value: number) => {
    if (value <= 0) return "hsl(var(--muted))";
    const ratio = value / Math.max(1, max);
    if (ratio > 0.75) return "hsl(var(--primary) / 0.55)";
    if (ratio > 0.5) return "hsl(var(--primary) / 0.4)";
    if (ratio > 0.25) return "hsl(var(--primary) / 0.28)";
    return "hsl(var(--primary) / 0.18)";
  };

  return (
    <div className="w-full">
      <div className="w-full aspect-[16/9] rounded-xl border bg-card">
        {!loading && (
          <ComposableMap projectionConfig={{ scale: 155 }} style={{ width: "100%", height: "100%" }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // Try multiple name props just in case
                  const rawName =
                    (geo.properties?.name as string) ||
                    (geo.properties?.NAME as string) ||
                    (geo.properties?.NAME_LONG as string) ||
                    "";
                  const key = rawName.toLowerCase();
                  const value = counts[key] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: getFill(value), outline: "none" },
                        hover: { fill: "hsl(var(--primary) / 0.7)", outline: "none" },
                        pressed: { fill: "hsl(var(--primary) / 0.7)", outline: "none" },
                      }}
                    >
                      <title>
                        {rawName}: {value}
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Hover countries to see document counts. Data from document_tracker.country.
      </div>
    </div>
  );
}
