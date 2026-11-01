import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const packagesQuery = queryOptions({
  queryKey: ["credit-packages"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("id, name, credits, price_inr, tagline, highlighted")
      .eq("active", true)
      .order("sort");
    if (error) throw error;
    return data;
  },
});
