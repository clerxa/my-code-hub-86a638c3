import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleRow {
  titre: string;
  type: string;
  description: string;
  points_inscription?: number;
  points_participation?: number;
  theme?: string;
  parcours?: string;
  entreprises?: string;
  duree?: string;
  url_inscription?: string;
  date_webinar?: string;
  embed_code?: string;
  objectifs_pedagogiques?: string;
  difficulte?: number;
  temps_estime?: number;
  questions_quiz?: string;
  url_calendrier?: string;
  type_contenu?: string;
  url_contenu?: string;
}

const typeMapping: Record<string, string> = {
  'webinar': 'webinar',
  'quiz': 'quiz',
  'meeting': 'meeting',
  'mixed': 'mixed',
  'content': 'content',
  'formation': 'formation',
  'guide': 'guide',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extraire le token JWT
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token?.length);
    
    if (!token || token === 'undefined' || token === 'null') {
      console.error('Invalid token value:', token);
      throw new Error('Invalid authorization token');
    }

    // Créer le client service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Décoder et vérifier le JWT manuellement via l'API GoTrue
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseServiceKey,
      },
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('JWT verification failed:', verifyResponse.status, errorText);
      throw new Error('Unauthorized');
    }

    const userData = await verifyResponse.json();
    const user = userData;
    
    if (!user || !user.id) {
      console.error('No user found in response');
      throw new Error('Unauthorized');
    }
    
    console.log('User verified:', user.id);

    // Vérifier que l'utilisateur est admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError?.message || 'No admin role found');
      throw new Error('Unauthorized: Admin role required');
    }

    console.log(`Admin user ${user.id} authenticated successfully`);

    const { modules } = await req.json() as { modules: ModuleRow[] };

    const report = {
      total: modules.length,
      created: 0,
      updated: 0,
      themesCreated: 0,
      parcoursCreated: 0,
      companiesCreated: 0,
      errors: [] as string[],
    };

    // Récupérer le dernier order_num pour les modules
    const { data: lastModule } = await supabase
      .from('modules')
      .select('order_num')
      .order('order_num', { ascending: false })
      .limit(1)
      .single();

    let currentOrderNum = lastModule?.order_num || 0;

    for (let i = 0; i < modules.length; i++) {
      const moduleData = modules[i];
      
      try {
        // Validation de base
        if (!moduleData.titre || !moduleData.type || !moduleData.description) {
          report.errors.push(`Ligne ${i + 1}: Champs obligatoires manquants (titre, type, description)`);
          continue;
        }

        // Résoudre le type
        const moduleType = typeMapping[moduleData.type.toLowerCase()];
        if (!moduleType) {
          report.errors.push(`Ligne ${i + 1}: Type invalide "${moduleData.type}". Types valides: ${Object.keys(typeMapping).join(', ')}`);
          continue;
        }

        // Préparer les thèmes (tableau)
        let themes: string[] = [];
        if (moduleData.theme) {
          themes = moduleData.theme.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        // Préparer les objectifs pédagogiques
        let objectifs: string[] = [];
        if (moduleData.objectifs_pedagogiques) {
          objectifs = moduleData.objectifs_pedagogiques.split(';').map(o => o.trim()).filter(o => o.length > 0);
        }

        // Construire l'objet module
        currentOrderNum++;
        
        const newModule: any = {
          title: moduleData.titre.trim(),
          type: moduleType,
          description: moduleData.description.trim(),
          order_num: currentOrderNum,
          points: moduleData.points_participation || moduleData.points_inscription || 0,
          theme: themes.length > 0 ? themes : null,
          pedagogical_objectives: objectifs.length > 0 ? objectifs : null,
          duration: moduleData.duree?.trim() || null,
          difficulty_level: moduleData.difficulte || 1,
          estimated_time: moduleData.temps_estime || null,
        };

        // Ajouter les champs spécifiques au type webinar
        if (moduleType === 'webinar') {
          newModule.webinar_registration_url = moduleData.url_inscription?.trim() || null;
          newModule.points_registration = moduleData.points_inscription || 50;
          newModule.points_participation = moduleData.points_participation || 100;
          
          if (moduleData.date_webinar) {
            try {
              newModule.webinar_date = new Date(moduleData.date_webinar).toISOString();
            } catch {
              report.errors.push(`Ligne ${i + 1}: Date webinar invalide "${moduleData.date_webinar}"`);
            }
          }
        }

        // Ajouter les champs spécifiques au type quiz
        if (moduleType === 'quiz') {
          if (moduleData.questions_quiz) {
            try {
              const questions = JSON.parse(moduleData.questions_quiz);
              newModule.quiz_questions = questions;
              newModule.points = moduleData.points_inscription || 100;
            } catch (error: any) {
              report.errors.push(`Ligne ${i + 1}: Format JSON invalide pour les questions quiz: ${error.message}`);
            }
          }
        }

        // Ajouter les champs spécifiques au type meeting
        if (moduleType === 'meeting') {
          newModule.appointment_calendar_url = moduleData.url_calendrier?.trim() || null;
          newModule.points = moduleData.points_inscription || 150;
        }

        // Ajouter les champs spécifiques au type formation/guide/content
        if (['formation', 'guide', 'content', 'mixed'].includes(moduleType)) {
          if (moduleData.type_contenu) {
            newModule.content_type = moduleData.type_contenu.trim();
          }
          if (moduleData.url_contenu) {
            newModule.content_url = moduleData.url_contenu.trim();
          }
          newModule.points = moduleData.points_inscription || 100;
        }

        if (moduleData.embed_code) {
          newModule.embed_code = moduleData.embed_code.trim();
        }

        // Vérifier si le module existe déjà (par titre + type)
        const { data: existingModule } = await supabase
          .from('modules')
          .select('id')
          .eq('title', newModule.title)
          .eq('type', newModule.type)
          .single();

        let moduleId: number;

        if (existingModule) {
          // Mise à jour
          const { data: updatedModule, error: updateError } = await supabase
            .from('modules')
            .update(newModule)
            .eq('id', existingModule.id)
            .select('id')
            .single();

          if (updateError) {
            report.errors.push(`Ligne ${i + 1}: Erreur mise à jour module "${moduleData.titre}": ${updateError.message}`);
            continue;
          }

          moduleId = updatedModule.id;
          report.updated++;
        } else {
          // Création
          const { data: createdModule, error: createError } = await supabase
            .from('modules')
            .insert(newModule)
            .select('id')
            .single();

          if (createError) {
            report.errors.push(`Ligne ${i + 1}: Erreur création module "${moduleData.titre}": ${createError.message}`);
            continue;
          }

          moduleId = createdModule.id;
          report.created++;
        }

        // Gérer le parcours si spécifié
        if (moduleData.parcours) {
          const parcoursName = moduleData.parcours.trim();
          
          // Chercher le parcours
          let { data: parcours } = await supabase
            .from('parcours')
            .select('id')
            .ilike('title', parcoursName)
            .single();

          if (!parcours) {
            // Créer le parcours
            const { data: newParcours, error: parcoursError } = await supabase
              .from('parcours')
              .insert({
                title: parcoursName,
                description: `Parcours créé automatiquement lors de l'import`,
              })
              .select('id')
              .single();

            if (parcoursError) {
              report.errors.push(`Ligne ${i + 1}: Erreur création parcours "${parcoursName}": ${parcoursError.message}`);
            } else {
              parcours = newParcours;
              report.parcoursCreated++;
            }
          }

          // Associer le module au parcours
          if (parcours) {
            // Vérifier si déjà associé
            const { data: existingLink } = await supabase
              .from('parcours_modules')
              .select('id')
              .eq('parcours_id', parcours.id)
              .eq('module_id', moduleId)
              .single();

            if (!existingLink) {
              // Récupérer le dernier order_num pour ce parcours
              const { data: lastParcoursModule } = await supabase
                .from('parcours_modules')
                .select('order_num')
                .eq('parcours_id', parcours.id)
                .order('order_num', { ascending: false })
                .limit(1)
                .single();

              const nextOrderNum = (lastParcoursModule?.order_num || 0) + 1;

              await supabase
                .from('parcours_modules')
                .insert({
                  parcours_id: parcours.id,
                  module_id: moduleId,
                  order_num: nextOrderNum,
                });
            }
          }
        }

        // Gérer les entreprises si spécifiées
        if (moduleData.entreprises) {
          const companyNames = moduleData.entreprises.split(',').map(c => c.trim()).filter(c => c.length > 0);
          
          for (const companyName of companyNames) {
            // Chercher l'entreprise
            let { data: company } = await supabase
              .from('companies')
              .select('id')
              .ilike('name', companyName)
              .single();

            if (!company) {
              // Créer l'entreprise
              const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({ name: companyName })
                .select('id')
                .single();

              if (companyError) {
                report.errors.push(`Ligne ${i + 1}: Erreur création entreprise "${companyName}": ${companyError.message}`);
                continue;
              }

              company = newCompany;
              report.companiesCreated++;
            }

            // Associer le module à l'entreprise via company_modules
            const { data: existingLink } = await supabase
              .from('company_modules')
              .select('id')
              .eq('company_id', company.id)
              .eq('module_id', moduleId)
              .single();

            if (!existingLink) {
              await supabase
                .from('company_modules')
                .insert({
                  company_id: company.id,
                  module_id: moduleId,
                  is_active: true,
                });
            }
          }
        }
      } catch (error: any) {
        report.errors.push(`Ligne ${i + 1}: ${error.message}`);
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
    console.error('Import modules error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});