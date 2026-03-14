-- ============================================================
-- Búsqueda de clientes insensible a acentos
-- Habilita extensión unaccent y crea RPCs de búsqueda
-- ============================================================

-- 1. Habilitar extensión unaccent
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- 2. RPC principal: búsqueda con unaccent, nombre+apellido, rut, email, teléfono
CREATE OR REPLACE FUNCTION public.search_clients(
  term text,
  limit_count int default 20,
  include_inactive boolean default false,
  digits text default null
) RETURNS TABLE (
  id int,
  "tipoCliente" text,
  "nombrePrincipal" text,
  "apellido" text,
  "razonSocial" text,
  "rut" text,
  "email" text,
  "telefono" text,
  "telefonoMovil" text,
  "calle" text,
  "ciudad" text,
  "region" text,
  "estado" text
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  normalized_term text := coalesce(trim(term), '');
  term_words text[] := regexp_split_to_array(normalized_term, '\s+');
  first_word text := null;
  rest_words text := null;
  normalized_digits text := coalesce(digits, '');
  term_unaccent text;
  first_word_unaccent text;
  rest_words_unaccent text;
BEGIN
  term_unaccent := lower(extensions.unaccent(normalized_term));

  IF array_length(term_words, 1) >= 2 THEN
    first_word := term_words[1];
    rest_words := array_to_string(term_words[2:array_length(term_words, 1)], ' ');
    first_word_unaccent := lower(extensions.unaccent(first_word));
    rest_words_unaccent := lower(extensions.unaccent(rest_words));
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c."tipoCliente",
    c."nombrePrincipal",
    c."apellido",
    c."razonSocial",
    c."rut",
    c."email",
    c."telefono",
    c."telefonoMovil",
    c."calle",
    c."ciudad",
    c."region",
    c."estado"
  FROM public."Client" c
  WHERE
    (include_inactive OR c."estado" = 'activo')
    AND (
      (
        array_length(term_words, 1) >= 2
        AND lower(extensions.unaccent(c."nombrePrincipal")) LIKE '%' || coalesce(first_word_unaccent, '') || '%'
        AND lower(extensions.unaccent(c."apellido")) LIKE '%' || coalesce(rest_words_unaccent, '') || '%'
      )
      OR lower(extensions.unaccent(c."nombrePrincipal")) LIKE '%' || term_unaccent || '%'
      OR lower(extensions.unaccent(c."apellido")) LIKE '%' || term_unaccent || '%'
      OR lower(extensions.unaccent(coalesce(c."razonSocial", ''))) LIKE '%' || term_unaccent || '%'
      OR lower(extensions.unaccent(coalesce(c."email", ''))) LIKE '%' || term_unaccent || '%'
      OR c."telefono" ILIKE '%' || normalized_term || '%'
      OR c."telefonoMovil" ILIKE '%' || normalized_term || '%'
      OR c."rut" ILIKE '%' || normalized_term || '%'
      OR (
        length(normalized_digits) >= 6
        AND regexp_replace(coalesce(c."rut", ''), '[.\-\s]', '', 'g') ILIKE '%' || normalized_digits || '%'
      )
    )
  ORDER BY c."nombrePrincipal" ASC
  LIMIT limit_count;
END;
$$;

-- 3. RPC auxiliar: obtener IDs con unaccent (para fallback y exportación)
CREATE OR REPLACE FUNCTION public.get_client_ids_search_unaccent(
  search_term text,
  p_limit int default 500,
  p_include_inactive boolean default false
)
RETURNS TABLE (id int)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
AS $$
DECLARE
  term_norm text;
  term_words text[] := regexp_split_to_array(coalesce(trim(search_term), ''), '\s+');
  first_word text;
  rest_words text;
  first_unaccent text;
  rest_unaccent text;
BEGIN
  term_norm := lower(extensions.unaccent(coalesce(trim(search_term), '')));
  IF term_norm = '' THEN
    RETURN;
  END IF;

  IF array_length(term_words, 1) >= 2 THEN
    first_word := term_words[1];
    rest_words := array_to_string(term_words[2:array_length(term_words, 1)], ' ');
    first_unaccent := lower(extensions.unaccent(first_word));
    rest_unaccent := lower(extensions.unaccent(rest_words));

    RETURN QUERY
    SELECT c.id
    FROM public."Client" c
    WHERE (p_include_inactive OR c."estado" = 'activo')
      AND lower(extensions.unaccent(coalesce(c."nombrePrincipal", ''))) LIKE '%' || first_unaccent || '%'
      AND lower(extensions.unaccent(coalesce(c."apellido", ''))) LIKE '%' || rest_unaccent || '%'
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT c.id
    FROM public."Client" c
    WHERE (p_include_inactive OR c."estado" = 'activo')
      AND (
        lower(extensions.unaccent(coalesce(c."nombrePrincipal", ''))) LIKE '%' || term_norm || '%'
        OR lower(extensions.unaccent(coalesce(c."apellido", ''))) LIKE '%' || term_norm || '%'
        OR lower(extensions.unaccent(coalesce(c."razonSocial", ''))) LIKE '%' || term_norm || '%'
        OR lower(extensions.unaccent(coalesce(c."email", ''))) LIKE '%' || term_norm || '%'
        OR c."telefono" ILIKE '%' || trim(search_term) || '%'
        OR c."telefonoMovil" ILIKE '%' || trim(search_term) || '%'
        OR c."rut" ILIKE '%' || trim(search_term) || '%'
        OR (
          length(regexp_replace(trim(search_term), '\D', '', 'g')) >= 6
          AND regexp_replace(coalesce(c."rut", ''), '[.\-\s]', '', 'g') ILIKE '%' || regexp_replace(trim(search_term), '\D', '', 'g') || '%'
        )
      )
    LIMIT p_limit;
  END IF;
END;
$$;
