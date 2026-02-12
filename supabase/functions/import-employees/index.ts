import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmployeeRow {
  prenom: string;
  nom: string;
  email: string;
  entreprise: string;
  domaine_email?: string;
  niveau_financier?: string;
  role?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !userData.user) {
      throw new Error('Unauthorized');
    }

    // Vérifier que l'utilisateur est admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Unauthorized: Admin role required');
    }

    const { employees } = await req.json() as { employees: EmployeeRow[] };

    const report = {
      total: employees.length,
      created: 0,
      updated: 0,
      companiesCreated: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      try {
        // Validation de base
        if (!employee.email || !employee.prenom || !employee.nom || !employee.entreprise) {
          report.errors.push(`Ligne ${i + 1}: Champs obligatoires manquants (prénom, nom, email, entreprise)`);
          continue;
        }

        // Nettoyer et valider l'email
        employee.email = employee.email.toLowerCase().trim();
        
        // Vérifier format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employee.email)) {
          report.errors.push(`Ligne ${i + 1}: Email invalide`);
          continue;
        }
        
        // Vérifier que l'email ne contient pas de caractères suspects
        if (employee.email.includes('domaine') || employee.email.startsWith('@')) {
          report.errors.push(`Ligne ${i + 1}: Format email incorrect`);
          continue;
        }

        // 1. Résoudre ou créer l'entreprise
        let companyId: string;
        
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', employee.entreprise.trim())
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Créer l'entreprise
          const newCompanyData: any = {
            name: employee.entreprise.trim(),
          };

          if (employee.domaine_email && employee.domaine_email.trim()) {
            // Nettoyer le domaine (enlever espaces, s'assurer qu'il commence par @)
            let domain = employee.domaine_email.trim();
            if (!domain.startsWith('@')) {
              domain = '@' + domain;
            }
            newCompanyData.email_domains = [domain];
          }

          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert(newCompanyData)
            .select('id')
            .single();

          if (companyError) {
            // Log detailed error server-side only
            console.error('Company creation error:', { line: i + 1, company: employee.entreprise, error: companyError });
            report.errors.push(`Ligne ${i + 1}: Impossible de créer l'entreprise`);
            continue;
          }

          companyId = newCompany.id;
          report.companiesCreated++;
        }

        // 2. Créer ou mettre à jour l'utilisateur
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', employee.email.toLowerCase().trim())
          .single();

        const profileData = {
          first_name: employee.prenom.trim(),
          last_name: employee.nom.trim(),
          email: employee.email.toLowerCase().trim(),
          company_id: companyId,
          company: employee.entreprise.trim(),
          role_metier: employee.role?.trim() || null,
          niveau_financier: employee.niveau_financier?.trim() || null,
          statut_invitation: 'invitation_non_envoyée',
          date_import: new Date().toISOString(),
        };

        if (existingProfile) {
          // Mise à jour
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', existingProfile.id);

          if (updateError) {
            // Log detailed error server-side only
            console.error('Profile update error:', { line: i + 1, email: employee.email, error: updateError });
            report.errors.push(`Ligne ${i + 1}: Erreur lors de la mise à jour du profil`);
            continue;
          }

          report.updated++;
        } else {
          // Création
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              ...profileData,
              id: crypto.randomUUID(),
            });

          if (insertError) {
            // Log detailed error server-side only
            console.error('Profile creation error:', { line: i + 1, email: employee.email, error: insertError });
            report.errors.push(`Ligne ${i + 1}: Impossible de créer le profil`);
            continue;
          }

          report.created++;
        }
      } catch (error: any) {
        console.error('Employee processing error:', { line: i + 1, error });
        report.errors.push(`Ligne ${i + 1}: Erreur de traitement`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Import employees error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Une erreur est survenue lors de l\'import' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
