-- 022_tips_category_label.sql
alter table tips add column if not exists category_label text default null;
