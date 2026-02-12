-- Add unique constraint on sidebar_type for upsert support
ALTER TABLE sidebar_configurations 
ADD CONSTRAINT sidebar_configurations_sidebar_type_unique UNIQUE (sidebar_type);