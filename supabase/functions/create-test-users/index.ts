import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId: string;
  planId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Use service role client to verify the JWT and get user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token using the admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Role check:', { roleData, roleError });

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Admin verified, creating test users...');

    const testUsers: TestUser[] = [
      {
        email: 'test.origin@fincare.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Origin',
        companyId: '45faa36e-6378-49ac-9d08-46f3c7e0fe0e',
        planId: 'a553cb34-a8eb-4e0f-a0ca-9d98c3d5ed62'
      },
      {
        email: 'test.hero@fincare.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Hero',
        companyId: '1ccb8a90-7258-4b19-b2a7-dd9b9402f616',
        planId: 'e6b9a986-25f7-44fd-927d-2e288c4d6c18'
      },
      {
        email: 'test.legend@fincare.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Legend',
        companyId: 'd90eb38b-46c4-4055-bf27-33c14acca777',
        planId: '7ceb9bf8-b1cb-4998-9c41-61233efed925'
      },
      {
        email: 'test.fantastic@fincare.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Fantastic',
        companyId: 'f23c1303-8964-458d-a71f-ee931cc0a935',
        planId: 'd721abcc-627a-4042-91dc-cb7a26339057'
      },
      {
        email: 'test.nopartner@fincare.test',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'NoPartner',
        companyId: '27e8ec74-8414-4c11-9400-169de944fbfa',
        planId: 'a553cb34-a8eb-4e0f-a0ca-9d98c3d5ed62'
      }
    ];

    const results = [];

    for (const testUser of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          company_id: testUser.companyId
        }
      });

      if (authError) {
        // Log detailed error server-side only
        console.error(`Error creating user ${testUser.email}:`, authError);
        results.push({ email: testUser.email, success: false, error: 'Impossible de créer l\'utilisateur' });
        continue;
      }

      // Update profile with plan_id
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ plan_id: testUser.planId })
        .eq('id', authData.user.id);

      if (profileError) {
        // Log detailed error server-side only
        console.error(`Error updating profile for ${testUser.email}:`, profileError);
        results.push({ email: testUser.email, success: false, error: 'Erreur de mise à jour du profil' });
      } else {
        results.push({ email: testUser.email, success: true, userId: authData.user.id });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
