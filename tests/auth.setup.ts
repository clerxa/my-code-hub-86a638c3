import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Setup pour l'authentification des tests E2E
 * Ce fichier gère la connexion de l'utilisateur de test
 */

// Credentials de test (à configurer via variables d'environnement)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-e2e@fincare.test';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestE2E2024!';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Nettoie les données de test avant chaque run
 */
export async function cleanupTestData() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase credentials not configured, skipping cleanup');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Connexion en tant qu'utilisateur de test pour nettoyer ses données
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (authError) {
    console.warn('⚠️ Could not authenticate for cleanup:', authError.message);
    return;
  }

  if (authData.user) {
    // Supprimer les simulations de test précédentes
    const { error: deleteError } = await supabase
      .from('simulations')
      .delete()
      .eq('user_id', authData.user.id)
      .ilike('nom_simulation', '%Test E2E%');

    if (deleteError) {
      console.warn('⚠️ Could not clean test simulations:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned successfully');
    }
  }

  await supabase.auth.signOut();
}

setup('authenticate', async ({ page }) => {
  // Nettoyer les données de test avant de commencer
  await cleanupTestData();

  // Aller sur la page de login
  await page.goto('/login');
  
  // Attendre que la page soit chargée
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

  // Remplir le formulaire de connexion
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);

  // Cliquer sur le bouton de connexion
  await page.click('button[type="submit"]');

  // Attendre la redirection après connexion
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // Vérifier que l'utilisateur est connecté
  await expect(page).not.toHaveURL(/\/login/);

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: '.auth/user.json' });
});
