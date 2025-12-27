-- this is not used by drizzle or not, I pasted them on supabase studio, so keeping here for future ref

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name(name TEXT)
    RETURNS TEXT AS
$$
BEGIN
    RETURN LOWER(
            TRIM(BOTH '-' FROM REGEXP_REPLACE(
                    REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                    name,
                                    '[^a-zA-Z0-9 -]', '', 'g'
                            ),
                            ' +', '-', 'g'
                    ),
                    '-+', '-', 'g'
                               ))
           );
END;
$$ LANGUAGE plpgsql;

-- Trigger function
CREATE OR REPLACE FUNCTION update_tour_slug()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.slug := generate_slug_from_name(NEW.tour_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger itself
CREATE TRIGGER set_tour_slug
    BEFORE INSERT OR UPDATE OF tour_name
    ON tours
    FOR EACH ROW
EXECUTE FUNCTION update_tour_slug();