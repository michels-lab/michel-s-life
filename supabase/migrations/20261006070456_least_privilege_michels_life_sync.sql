revoke all privileges on table public.ml_state from anon, authenticated;
revoke all privileges on table public.ml_state_history from anon, authenticated;
revoke all privileges on table public.ml_devices from anon, authenticated;

grant select, insert, update, delete on table public.ml_state to authenticated;
grant select, insert on table public.ml_state_history to authenticated;
grant select, insert, update, delete on table public.ml_devices to authenticated;
