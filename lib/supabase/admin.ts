import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * service_role 키로 RLS를 우회하는 서버 전용 admin 클라이언트.
 * Server Action/Route Handler에서만 사용하고, 절대 클라이언트
 * 컴포넌트에서 import하거나 브라우저로 노출하지 않는다.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
