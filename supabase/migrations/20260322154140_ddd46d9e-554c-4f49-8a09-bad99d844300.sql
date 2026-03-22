alter table profiles 
add column if not exists onboarding_step integer default 1,
add column if not exists onboarding_completed boolean default false,
add column if not exists atlas_completed boolean default false,
add column if not exists audit_panorama_completed boolean default false,
add column if not exists risk_profile_completed boolean default false,
add column if not exists horizon_completed boolean default false,
add column if not exists vega_skipped boolean default false;