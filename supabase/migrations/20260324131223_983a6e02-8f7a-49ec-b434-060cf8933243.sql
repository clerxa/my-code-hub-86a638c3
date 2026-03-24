-- Reset employee_onboarding_completed for test account
UPDATE profiles SET employee_onboarding_completed = false WHERE email = 'xavier.fincare@gmail.com';