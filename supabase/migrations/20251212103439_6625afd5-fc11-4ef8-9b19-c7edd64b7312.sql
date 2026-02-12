-- Insert default expert booking URL setting
INSERT INTO settings (key, value)
VALUES ('default_expert_booking_url', '"https://calendly.com/perlib-expert"')
ON CONFLICT (key) DO NOTHING;