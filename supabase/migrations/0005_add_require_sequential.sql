-- Ajout de require_sequential (présent dans l'export d'origine mais jamais stocké) :
-- si true, la leçon est verrouillée tant que la leçon précédente du parcours
-- n'est pas marquée "completed" par l'étudiant.
alter table lessons add column if not exists require_sequential boolean not null default false;
