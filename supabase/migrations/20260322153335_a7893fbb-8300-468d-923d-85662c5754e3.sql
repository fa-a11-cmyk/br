
CREATE OR REPLACE FUNCTION schedule_booking_reminders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config jsonb;
  v_owner_id uuid;
  v_rdv_ts timestamptz;
  v_phone text;
  v_email text;
BEGIN
  IF NEW.status != 'confirmed' THEN RETURN NEW; END IF;

  SELECT reminder_config, user_id INTO v_config, v_owner_id
  FROM landing_pages WHERE id = NEW.landing_page_id;

  v_config := COALESCE(v_config, '{}'::jsonb);
  v_phone := NEW.prospect_phone;
  v_email := NEW.prospect_email;
  v_rdv_ts := (NEW.booked_date || ' ' || NEW.booked_time)::timestamptz;

  -- Confirmation email
  INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
  VALUES (NEW.id, v_owner_id, 'email', 'confirmation', now(), v_phone, v_email);

  -- Reminder 24h
  IF (v_config->>'reminder_24h')::boolean IS DISTINCT FROM false THEN
    INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
    VALUES (NEW.id, v_owner_id, 'email', 'reminder_24h', v_rdv_ts - interval '24 hours', v_phone, v_email);
    IF (v_config->>'sms_enabled')::boolean IS NOT DISTINCT FROM true AND v_phone IS NOT NULL THEN
      INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
      VALUES (NEW.id, v_owner_id, 'sms', 'reminder_24h', v_rdv_ts - interval '24 hours', v_phone, v_email);
    END IF;
    IF (v_config->>'whatsapp_enabled')::boolean = true AND v_phone IS NOT NULL THEN
      INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
      VALUES (NEW.id, v_owner_id, 'whatsapp', 'reminder_24h', v_rdv_ts - interval '24 hours', v_phone, v_email);
    END IF;
  END IF;

  -- Reminder 1h
  IF (v_config->>'reminder_1h')::boolean IS DISTINCT FROM false THEN
    IF (v_config->>'sms_enabled')::boolean IS NOT DISTINCT FROM true AND v_phone IS NOT NULL THEN
      INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
      VALUES (NEW.id, v_owner_id, 'sms', 'reminder_1h', v_rdv_ts - interval '1 hour', v_phone, v_email);
    END IF;
    IF (v_config->>'voice_enabled')::boolean = true AND v_phone IS NOT NULL THEN
      INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
      VALUES (NEW.id, v_owner_id, 'voice', 'reminder_1h', v_rdv_ts - interval '1 hour', v_phone, v_email);
    END IF;
  END IF;

  -- Followup 2h
  IF (v_config->>'followup_2h')::boolean IS NOT DISTINCT FROM true AND v_phone IS NOT NULL THEN
    INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
    VALUES (NEW.id, v_owner_id, 'sms', 'followup_2h', v_rdv_ts + interval '2 hours', v_phone, v_email);
  END IF;

  -- No-show detection
  IF (v_config->>'no_show_detection')::boolean IS NOT DISTINCT FROM true AND v_phone IS NOT NULL THEN
    INSERT INTO reminder_schedules (booking_id, user_id, channel, reminder_type, scheduled_at, to_phone, to_email)
    VALUES (NEW.id, v_owner_id,
      CASE WHEN (v_config->>'whatsapp_enabled')::boolean = true THEN 'whatsapp' ELSE 'sms' END,
      'no_show',
      v_rdv_ts + (COALESCE((v_config->>'no_show_delay_minutes')::integer, 15) * interval '1 minute'),
      v_phone, v_email);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created_schedule ON public.landing_bookings;
CREATE TRIGGER on_booking_created_schedule
  AFTER INSERT ON public.landing_bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION schedule_booking_reminders();
