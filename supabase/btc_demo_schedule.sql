-- Apply after the new HF/Edge transition has been verified successfully.
-- The secret is provisioned separately in Vault; never place it in source.
select cron.alter_job(jobid, active := false)
from cron.job where jobname = 'run-unidream-inference-15m';
select cron.schedule(
  'run-wm-research-demo-15m',
  '0,15,30,45 * * * *',
  $command$
  select net.http_post(
    url := 'https://kgioxjzhsauxwbsrsvxp.supabase.co/functions/v1/run-wm-research-demo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-region', 'ap-northeast-1',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'btc_research_demo_scheduler_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $command$
);
