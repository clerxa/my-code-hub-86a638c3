import { z } from 'zod';

// ============================================
// Company Validation Schemas
// ============================================

export const companyCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(255, "Le nom ne peut pas dépasser 255 caractères"),
  logo_url: z.string().url("URL invalide").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide").default("#3b82f6"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hexadécimale invalide").default("#8b5cf6"),
  plan_id: z.string().uuid("ID de plan invalide").nullable().optional(),
  rang: z.number().int().positive().nullable().optional(),
});

export const companyEditSchema = companyCreateSchema.extend({
  referral_typeform_url: z.string().url("URL invalide").optional().or(z.literal("")),
  expert_booking_url: z.string().url("URL invalide").optional().or(z.literal("")),
  expert_booking_hubspot_embed: z.string().max(5000, "Le code embed ne peut pas dépasser 5000 caractères").optional().or(z.literal("")),
  email_domains: z.array(z.string().max(255)).optional(),
  partnership_type: z.string().max(100).optional().or(z.literal("")),
  company_size: z.number().int().positive().nullable().optional(),
  employee_locations: z.array(z.string().max(255)).optional(),
  has_foreign_employees: z.boolean().optional(),
  work_mode: z.string().max(100).optional().or(z.literal("")),
});

// ============================================
// User/Profile Validation Schemas
// ============================================

export const profileEditSchema = z.object({
  first_name: z.string().trim().max(100, "Le prénom ne peut pas dépasser 100 caractères").nullable().optional(),
  last_name: z.string().trim().max(100, "Le nom ne peut pas dépasser 100 caractères").nullable().optional(),
  email: z.string().email("Email invalide").max(255),
  phone_number: z.string().max(20, "Numéro trop long").nullable().optional(),
  birth_date: z.string().nullable().optional(),
  marital_status: z.string().max(50).nullable().optional(),
  children_count: z.number().int().min(0).max(20).nullable().optional(),
  job_title: z.string().max(100).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  total_points: z.number().int().min(0).optional(),
});

// ============================================
// Module Validation Schemas
// ============================================

export const quizAnswerSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, "La réponse est requise").max(500, "Réponse trop longue"),
  isCorrect: z.boolean(),
});

export const quizQuestionSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "La question est requise").max(500, "Question trop longue"),
  description: z.string().max(1000).optional(),
  points: z.number().int().min(0).max(1000),
  type: z.enum(["single", "multiple"]),
  answers: z.array(quizAnswerSchema).min(2, "Au moins 2 réponses requises").max(10),
});

export const moduleSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(255, "Le titre ne peut pas dépasser 255 caractères"),
  type: z.enum(["webinar", "quiz", "guide", "meeting", "video"]),
  description: z.string().trim().min(1, "La description est requise").max(5000, "Description trop longue"),
  points: z.number().int().min(0).max(10000),
  content_url: z.string().url("URL invalide").optional().or(z.literal("")).or(z.literal(null)),
  webinar_date: z.string().optional().or(z.literal("")).or(z.literal(null)),
  webinar_registration_url: z.string().url("URL invalide").optional().or(z.literal("")).or(z.literal(null)),
  webinar_image_url: z.string().url("URL invalide").optional().or(z.literal("")).or(z.literal(null)),
  quiz_questions: z.array(quizQuestionSchema).optional(),
  appointment_calendar_url: z.string().url("URL invalide").optional().or(z.literal("")).or(z.literal(null)),
  content_type: z.enum(["video", "slides", "text", "resources", "mixed"]).optional(),
  embed_code: z.string().max(10000, "Code embed trop long").optional().or(z.literal("")).or(z.literal(null)),
  estimated_time: z.number().int().min(1).max(480).optional(),
  difficulty_level: z.number().int().min(1).max(5).optional(),
  pedagogical_objectives: z.array(z.string().max(500)).max(10).optional(),
  key_takeaways: z.array(z.string().max(500)).max(10).optional(),
  themes: z.array(z.string().max(100)).max(5).optional(),
});

// ============================================
// Contact Validation Schemas
// ============================================

export const companyContactSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis").max(255, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().max(20, "Numéro trop long").optional().or(z.literal("")),
  role_contact: z.string().max(100, "Rôle trop long").optional().or(z.literal("")),
});

// ============================================
// Email Domain Validation
// ============================================

export const emailDomainSchema = z.string()
  .trim()
  .min(1, "Le domaine est requis")
  .max(255, "Domaine trop long")
  .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, "Format de domaine invalide");

// ============================================
// Validation Helper Functions
// ============================================

export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

export const getValidationErrorMessages = (error: z.ZodError): string[] => {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
};

export const getFirstValidationError = (error: z.ZodError): string => {
  const firstError = error.errors[0];
  return firstError?.message || "Erreur de validation";
};
