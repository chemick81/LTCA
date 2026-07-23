-- Ajout du type de bloc "embed" (iframe générique — Genially ou autre)
-- pour remplacer les blocs interactifs Tier 2/3 par de vrais modules Genially
-- déjà réalisés, plutôt qu'une réimplémentation maison approximative.
alter type lesson_block_type add value if not exists 'embed';
