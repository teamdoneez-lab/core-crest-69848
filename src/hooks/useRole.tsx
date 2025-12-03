import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'pro' | 'admin' | 'supplier';

interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
}

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfile(null);
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      } else if (roleData) {
        setRole(roleData.role as UserRole);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (r: UserRole): boolean => {
    return role === r;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return role ? roles.includes(role) : false;
  };

  return {
    profile,
    role,
    loading: loading || authLoading,
    hasRole,
    hasAnyRole,
    isCustomer: hasRole('customer'),
    isPro: hasRole('pro'),
    isAdmin: hasRole('admin')
  };
}
