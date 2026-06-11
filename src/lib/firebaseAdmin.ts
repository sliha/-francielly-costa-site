// Shim de compatibilidade pós-migração para Supabase.
// O antigo Firebase Admin SDK foi substituído. verifyAdminRequest vive agora em '@/lib/auth'.
// Rotas que apenas usavam verifyAdminRequest continuam a funcionar sem alterações.
export { verifyAdminRequest, getAdminEmails } from './auth'
