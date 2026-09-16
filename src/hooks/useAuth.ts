/**
 * Small authentication helper used across the app.
 * Tells us who is signed in and whether that person is an admin/organizer.
 */
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRole(current: User | null) {
      if (!current) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: current.id,
        _role: "admin",
      });
      if (active) setIsAdmin(Boolean(data));
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const current = data.session?.user ?? null;
      if (!active) return;
      setUser(current);
      await loadRole(current);
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user ?? null;
      setUser(current);
      void loadRole(current);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}
