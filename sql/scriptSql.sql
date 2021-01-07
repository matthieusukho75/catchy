-- Table: catchy.lead
-- DROP TABLE catchy.lead;
--chy_01_adm
CREATE SCHEMA
IF NOT EXISTS catchy AUTHORIZATION chy_01_adm;

-- SEQUENCE: catchy.event_event_id_seq
-- DROP SEQUENCE catchy.event_event_id_seq;

CREATE SEQUENCE
IF NOT EXISTS catchy.event_event_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE catchy.event_event_id_seq
OWNER TO chy_01_adm;

-- SEQUENCE: catchy.dealer_id_seq
-- DROP SEQUENCE catchy.dealer_id_seq;
CREATE SEQUENCE
IF NOT EXISTS catchy.dealer_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE catchy.dealer_id_seq
OWNER TO chy_01_adm;

-- SEQUENCE: catchy.form_id_seq
-- DROP SEQUENCE catchy.form_id_seq;
CREATE SEQUENCE
IF NOT EXISTS catchy.form_id_seq
    CYCLE
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE catchy.form_id_seq
OWNER TO chy_01_adm;

-- SEQUENCE: catchy.id_lead_error
-- DROP SEQUENCE catchy.id_lead_error;
CREATE SEQUENCE
IF NOT EXISTS  catchy.id_lead_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE catchy.id_lead_seq
OWNER TO chy_01_adm;

-- DROP TABLE IF EXISTS catchy.lead;
CREATE TABLE
IF NOT EXISTS catchy.lead
(
    id integer NOT NULL DEFAULT nextval
('catchy.id_lead_seq'::regclass),
   id_lead_submission text COLLATE pg_catalog."default" ,
   date_creation timestamp without time zone,
   lead_obj jsonb,
   succes boolean,
    msg_error text COLLATE pg_catalog."default",
   CONSTRAINT lead_pkey PRIMARY KEY
(id)
) TABLESPACE pg_default;

ALTER TABLE catchy.lead OWNER to chy_01_adm;

-- Index: index_lead

-- DROP INDEX catchy.index_lead;

CREATE INDEX index_lead
    ON catchy.lead USING btree
    (id ASC NULLS LAST, id_lead_submission COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Table: catchy.dealer
-- DROP TABLE catchy.dealer;
CREATE TABLE
IF NOT EXISTS catchy.dealer
(
    id integer NOT NULL DEFAULT nextval
('catchy.dealer_id_seq'::regclass),
    code_rrf text COLLATE pg_catalog."default",
    nom_affaire text COLLATE pg_catalog."default",
    postal_code character varying
(255) COLLATE pg_catalog."default",
    CONSTRAINT dealer_pkey PRIMARY KEY
(id)
)
TABLESPACE pg_default;

ALTER TABLE catchy.dealer
    OWNER to chy_01_adm;


-- Index: index_dealer

-- DROP INDEX catchy.index_dealer;

CREATE INDEX index_dealer
    ON catchy.dealer USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;



-- Table: catchy.event
-- DROP TABLE catchy.event;
--DROP TABLE IF EXISTS catchy.event;
CREATE TABLE
IF NOT EXISTS catchy.event
(
    event_id integer NOT NULL DEFAULT nextval
('catchy.event_event_id_seq'::regclass),
    event_obj jsonb,
    code_event text COLLATE pg_catalog."default",
    is_tempo boolean,
    hours_tempo integer,
    CONSTRAINT event_pkey PRIMARY KEY
(event_id)
)

TABLESPACE pg_default;

ALTER TABLE catchy.event
    OWNER to chy_01_adm;

-- Index: index_event

-- DROP INDEX catchy.index_event;

CREATE INDEX index_event
    ON catchy.event USING btree
    (event_id ASC NULLS LAST)
    TABLESPACE pg_default;

-- Table: catchy.form_tempo

--DROP TABLE IF EXISTS catchy.form_tempo;

CREATE TABLE
IF NOT EXISTS  catchy.form_tempo
(
    id integer DEFAULT nextval
('catchy.form_id_seq'::regclass),
    form_obj jsonb,
    event_id integer,
    date_tempo timestamp without time zone
)

TABLESPACE pg_default;

ALTER TABLE catchy.form_tempo
    OWNER to chy_01_adm;

-- Index: index_form_tempo

-- DROP INDEX catchy.index_form_tempo;

CREATE INDEX index_form_tempo
    ON catchy.form_tempo USING btree
    (id ASC NULLS LAST, date_tempo ASC NULLS LAST)
    TABLESPACE pg_default;

UPDATE  catchy.lead SET date_creation=now();
UPDATE  catchy.lead SET succes=true;

ALTER TABLE  catchy.event
ADD COLUMN date_creation timestamp without time zone;
UPDATE  catchy.event set date_creation=now();

ALTER TABLE  catchy.event
ADD COLUMN path text;

ALTER TABLE  catchy.event
ADD COLUMN image_name text;