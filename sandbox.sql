select * from usage where ident is not null limit 100;

select
  count(*) as views,
  count(distinct session) as sessions,
  count(distinct ident) as users,
  date_part('week', created_at) AS week
from usage
--where created_at > now() - interval '120' day
group by week
order by week desc

