-- Match the game catalogue to the static game build bundled with the main website.
-- Relative URL works on localhost, LAN and the production domain.
update public.games set embed_url = '/digital-play/index.html'
where type = 'digital' and digital_key in ('conway','deal','knn','sequence','planarity','symmetry');
