-- Contatos de membros não devem estar disponíveis para qualquer conta vinculada.
drop policy if exists people_read on public.people;
create policy people_read on public.people
 for select to authenticated
 using(public.has_church_role(church_id,array['admin','pastor','coordenador']::public.church_role[]));

-- A associação à igreja não dá direito a listar os usuários da comunidade.
-- O perfil básico pode ser visualizado apenas pelo próprio usuário.
