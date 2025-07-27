--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approval_level; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.approval_level AS ENUM (
    'operativo',
    'supervisor',
    'gerente',
    'director',
    'ejecutivo'
);


ALTER TYPE public.approval_level OWNER TO neondb_owner;

--
-- Name: authorization_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.authorization_status AS ENUM (
    'pendiente',
    'en_revision',
    'aprobado',
    'rechazado',
    'cancelado'
);


ALTER TYPE public.authorization_status OWNER TO neondb_owner;

--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.contract_status AS ENUM (
    'borrador',
    'promesa',
    'firmado',
    'cancelado',
    'entregado'
);


ALTER TYPE public.contract_status OWNER TO neondb_owner;

--
-- Name: dependency_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.dependency_type AS ENUM (
    'finish_to_start',
    'start_to_start',
    'finish_to_finish',
    'start_to_finish'
);


ALTER TYPE public.dependency_type OWNER TO neondb_owner;

--
-- Name: financing_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.financing_type AS ENUM (
    'contado',
    'credito_bancario',
    'credito_constructor',
    'mixto'
);


ALTER TYPE public.financing_type OWNER TO neondb_owner;

--
-- Name: identification_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.identification_type AS ENUM (
    'cedula',
    'pasaporte',
    'nit',
    'cedula_extranjera'
);


ALTER TYPE public.identification_type OWNER TO neondb_owner;

--
-- Name: lot_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.lot_status AS ENUM (
    'disponible',
    'apartado',
    'promesa',
    'vendido',
    'escriturado'
);


ALTER TYPE public.lot_status OWNER TO neondb_owner;

--
-- Name: permit_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.permit_status AS ENUM (
    'pendiente',
    'en_revision',
    'aprobado',
    'rechazado',
    'vencido'
);


ALTER TYPE public.permit_status OWNER TO neondb_owner;

--
-- Name: permit_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.permit_type AS ENUM (
    'licencia_construccion',
    'factibilidad_servicios',
    'impacto_ambiental',
    'proteccion_civil',
    'uso_suelo',
    'zonificacion',
    'vialidad'
);


ALTER TYPE public.permit_type OWNER TO neondb_owner;

--
-- Name: project_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_status AS ENUM (
    'planeacion',
    'diseño',
    'tramites',
    'construccion',
    'ventas',
    'entrega'
);


ALTER TYPE public.project_status OWNER TO neondb_owner;

--
-- Name: project_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_type AS ENUM (
    'residencial',
    'industrial',
    'comercial',
    'usos_mixtos'
);


ALTER TYPE public.project_type OWNER TO neondb_owner;

--
-- Name: workflow_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.workflow_type AS ENUM (
    'contratacion',
    'orden_cambio',
    'pago',
    'liberacion_credito',
    'capital_call'
);


ALTER TYPE public.workflow_type OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authority_delegations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authority_delegations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    delegator_id character varying NOT NULL,
    delegate_id character varying NOT NULL,
    workflow_types character varying[],
    max_amount character varying,
    valid_from timestamp without time zone NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.authority_delegations OWNER TO neondb_owner;

--
-- Name: authorization_matrix; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_matrix (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_type public.workflow_type NOT NULL,
    min_amount character varying DEFAULT '0'::character varying,
    max_amount character varying,
    required_level public.approval_level NOT NULL,
    requires_sequential boolean DEFAULT false,
    escalation_hours integer DEFAULT 24,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.authorization_matrix OWNER TO neondb_owner;

--
-- Name: authorization_steps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_steps (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    approver_id character varying NOT NULL,
    action character varying NOT NULL,
    comments text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.authorization_steps OWNER TO neondb_owner;

--
-- Name: authorization_workflows; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_workflows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying,
    workflow_type public.workflow_type NOT NULL,
    title character varying NOT NULL,
    description text,
    amount numeric(15,2),
    requested_by character varying NOT NULL,
    current_approver character varying,
    status public.authorization_status DEFAULT 'pendiente'::public.authorization_status NOT NULL,
    priority character varying DEFAULT 'medium'::character varying,
    due_date timestamp without time zone,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    rejection_reason text,
    attachments text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.authorization_workflows OWNER TO neondb_owner;

--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.budget_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    parent_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.budget_categories OWNER TO neondb_owner;

--
-- Name: budget_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.budget_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    category_id character varying NOT NULL,
    name character varying NOT NULL,
    budgeted_amount numeric(15,2) NOT NULL,
    actual_amount numeric(15,2) DEFAULT '0'::numeric,
    commited_amount numeric(15,2) DEFAULT '0'::numeric,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.budget_items OWNER TO neondb_owner;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.calendar_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying,
    title character varying NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    all_day boolean DEFAULT false,
    priority character varying DEFAULT 'medium'::character varying,
    assigned_to character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.calendar_events OWNER TO neondb_owner;

--
-- Name: capital_call_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.capital_call_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    capital_call_id character varying NOT NULL,
    investor_id character varying NOT NULL,
    requested_amount numeric(15,2) NOT NULL,
    paid_amount numeric(15,2) DEFAULT '0'::numeric,
    paid_date timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying
);


ALTER TABLE public.capital_call_items OWNER TO neondb_owner;

--
-- Name: capital_calls; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.capital_calls (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    call_number integer NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    call_date timestamp without time zone NOT NULL,
    due_date timestamp without time zone NOT NULL,
    purpose text,
    status character varying DEFAULT 'pending'::character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.capital_calls OWNER TO neondb_owner;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying,
    phone character varying,
    address text,
    tax_id character varying,
    birth_date timestamp without time zone,
    occupation character varying,
    monthly_income numeric(12,2),
    marital_status character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    identification_type public.identification_type DEFAULT 'cedula'::public.identification_type NOT NULL,
    identification_number character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying,
    permit_id character varying,
    name character varying NOT NULL,
    file_name character varying NOT NULL,
    file_size integer,
    mime_type character varying,
    uploaded_by character varying NOT NULL,
    category character varying,
    file_path character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO neondb_owner;

--
-- Name: investors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.investors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    email character varying,
    phone character varying,
    investor_type character varying DEFAULT 'individual'::character varying,
    tax_id character varying,
    bank_account character varying,
    bank_name character varying,
    total_commitment numeric(15,2),
    total_contributed numeric(15,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.investors OWNER TO neondb_owner;

--
-- Name: lots; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lots (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    lot_number character varying NOT NULL,
    block character varying,
    area numeric(10,2),
    price_per_m2 numeric(10,2),
    total_price numeric(15,2),
    status public.lot_status DEFAULT 'disponible'::public.lot_status NOT NULL,
    characteristics text,
    reserved_by character varying,
    reserved_date timestamp without time zone,
    sold_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lots OWNER TO neondb_owner;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    contract_id character varying NOT NULL,
    payment_number integer NOT NULL,
    due_date timestamp without time zone NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric,
    paid_date timestamp without time zone,
    payment_method character varying,
    reference character varying,
    status character varying DEFAULT 'pending'::character varying,
    late_fee numeric(10,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: permits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permits (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    name character varying NOT NULL,
    type public.permit_type NOT NULL,
    status public.permit_status DEFAULT 'pendiente'::public.permit_status NOT NULL,
    request_date timestamp without time zone,
    due_date timestamp without time zone,
    approval_date timestamp without time zone,
    cost numeric(10,2),
    responsible_person character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.permits OWNER TO neondb_owner;

--
-- Name: project_investors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_investors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    investor_id character varying NOT NULL,
    participation_percentage numeric(5,2),
    commitment_amount numeric(15,2),
    contributed_amount numeric(15,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.project_investors OWNER TO neondb_owner;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type public.project_type NOT NULL,
    location text,
    total_land_area numeric(12,2),
    sellable_area numeric(12,2),
    planned_units integer,
    total_budget numeric(15,2),
    status public.project_status DEFAULT 'planeacion'::public.project_status NOT NULL,
    progress integer DEFAULT 0,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: sales_contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_contracts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    lot_id character varying NOT NULL,
    client_id character varying NOT NULL,
    contract_type character varying NOT NULL,
    contract_number character varying,
    total_amount numeric(15,2) NOT NULL,
    down_payment numeric(15,2),
    monthly_payment numeric(12,2),
    payment_term integer,
    contract_date timestamp without time zone NOT NULL,
    delivery_date timestamp without time zone,
    status character varying DEFAULT 'active'::character varying,
    special_conditions text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_contracts OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: task_dependencies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_dependencies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    predecessor_id character varying NOT NULL,
    successor_id character varying NOT NULL,
    dependency_type public.dependency_type DEFAULT 'finish_to_start'::public.dependency_type NOT NULL,
    lead_lag integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.task_dependencies OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'operativo'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    authorization_limit character varying DEFAULT '50000'::character varying,
    department character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: wbs_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wbs_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    project_id character varying NOT NULL,
    parent_id character varying,
    wbs_code character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    level integer DEFAULT 1 NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    duration integer,
    progress integer DEFAULT 0,
    budgeted_cost numeric(15,2),
    actual_cost numeric(15,2),
    is_milestone boolean DEFAULT false,
    is_critical boolean DEFAULT false,
    assigned_to character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wbs_items OWNER TO neondb_owner;

--
-- Name: workflow_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.workflow_notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    recipient_id character varying NOT NULL,
    notification_type character varying NOT NULL,
    message text NOT NULL,
    sent_at timestamp without time zone,
    read_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workflow_notifications OWNER TO neondb_owner;

--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.workflow_steps (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying NOT NULL,
    step_order integer NOT NULL,
    approver_level public.approval_level NOT NULL,
    assigned_approver_id character varying,
    is_required boolean DEFAULT true,
    status public.authorization_status DEFAULT 'pendiente'::public.authorization_status,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    comments text,
    escalated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workflow_steps OWNER TO neondb_owner;

--
-- Data for Name: authority_delegations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authority_delegations (id, delegator_id, delegate_id, workflow_types, max_amount, valid_from, valid_until, is_active, reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: authorization_matrix; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_matrix (id, workflow_type, min_amount, max_amount, required_level, requires_sequential, escalation_hours, is_active, created_at, updated_at) FROM stdin;
0861db1f-4f7e-47ae-8125-d45c955f734b	pago	0	25000	supervisor	f	12	t	2025-07-26 08:49:47.435	2025-07-26 08:49:47.435
912ba242-87b9-4671-b07c-e446e7ade9dd	pago	25001	100000	gerente	f	24	t	2025-07-26 08:49:47.666	2025-07-26 08:49:47.666
bceda891-3d92-49fc-a07a-6316d8f62480	pago	100001	500000	director	t	48	t	2025-07-26 08:49:47.712	2025-07-26 08:49:47.712
988b1c17-2042-473b-b600-df82f70d6e2a	pago	500001	\N	ejecutivo	t	72	t	2025-07-26 08:49:47.757	2025-07-26 08:49:47.757
3fac0233-e742-4488-b116-05cfea2ae2d7	contratacion	0	100000	gerente	f	48	t	2025-07-26 08:49:47.801	2025-07-26 08:49:47.801
9b2125de-cd3e-441b-a749-70dd66636921	contratacion	100001	500000	director	t	72	t	2025-07-26 08:49:47.845	2025-07-26 08:49:47.845
a8d44286-80be-44c9-85af-fd0372c8f56d	contratacion	500001	\N	ejecutivo	t	168	t	2025-07-26 08:49:47.891	2025-07-26 08:49:47.891
1e8e1f38-20a4-4db0-8443-7aa079af3aea	orden_cambio	0	50000	gerente	f	24	t	2025-07-26 08:49:47.936	2025-07-26 08:49:47.936
6db3d476-790f-4a4c-bb08-1635d7361ee2	orden_cambio	50001	250000	director	t	72	t	2025-07-26 08:49:47.981	2025-07-26 08:49:47.981
5aed7084-9a9f-4a71-a18b-35af4d75efaa	orden_cambio	250001	\N	ejecutivo	t	168	t	2025-07-26 08:49:48.027	2025-07-26 08:49:48.027
5897eb60-2649-4117-afc6-d9064b015d42	liberacion_credito	0	100000	director	f	24	t	2025-07-26 08:49:48.071	2025-07-26 08:49:48.071
9a1da7a3-a1a4-4f0b-a7b8-4ec7cd10cf6f	liberacion_credito	100001	\N	ejecutivo	t	48	t	2025-07-26 08:49:48.116	2025-07-26 08:49:48.116
d950503d-5e5d-4cc2-9de4-0d1171a186e0	capital_call	0	500000	director	t	72	t	2025-07-26 08:49:48.161	2025-07-26 08:49:48.161
b85a2a41-ef1e-4fb4-a860-79438ebba432	capital_call	500001	\N	ejecutivo	t	168	t	2025-07-26 08:49:48.205	2025-07-26 08:49:48.205
\.


--
-- Data for Name: authorization_steps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_steps (id, workflow_id, approver_id, action, comments, "timestamp") FROM stdin;
\.


--
-- Data for Name: authorization_workflows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_workflows (id, project_id, workflow_type, title, description, amount, requested_by, current_approver, status, priority, due_date, approved_at, rejected_at, rejection_reason, attachments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: budget_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.budget_categories (id, name, parent_id, created_at) FROM stdin;
7cc40d97-525b-4aa1-81e4-3267cb48b8db	Terreno y Predios	\N	2025-07-26 07:18:49.482
ad5bb72b-f434-4b33-8236-a17e23c3e47d	Proyectos y Licencias	\N	2025-07-26 07:18:49.529
6abb3fdd-6267-4fe4-b379-30873ae99cd5	Infraestructura	\N	2025-07-26 07:18:49.572
c2e53cff-8944-4816-afb6-412bc9970de9	Construcción	\N	2025-07-26 07:18:49.614
9d49c8bf-b5f1-4d36-aafa-09e4997f723f	Acabados	\N	2025-07-26 07:18:49.656
6186cb1b-cd44-439d-9ca7-4ec25d90ffc3	Instalaciones	\N	2025-07-26 07:18:49.698
e99fa6a9-6e6f-48ff-a2c8-7ce215fdcf3d	Áreas Comunes	\N	2025-07-26 07:18:49.74
258f0131-de34-43bd-9f9d-3d29e1002222	Ventas y Marketing	\N	2025-07-26 07:18:49.781
642ba7a2-e08b-4554-b338-a347ed8fc120	Gastos Administrativos	\N	2025-07-26 07:18:49.823
39e2e9f4-0da0-4aa5-88ac-208f521943d2	Contingencias	\N	2025-07-26 07:18:49.864
\.


--
-- Data for Name: budget_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.budget_items (id, project_id, category_id, name, budgeted_amount, actual_amount, commited_amount, description, created_at, updated_at) FROM stdin;
2027a8ff-7fb5-431f-b88c-8100987c448b	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	7cc40d97-525b-4aa1-81e4-3267cb48b8db	Adquisición de terreno	12000000.00	12000000.00	0.00	Compra del terreno de 5000 m²	2025-07-26 07:19:47.616	2025-07-26 07:19:47.616
b0d6758d-3618-4f98-bf02-07c98d7fa410	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	ad5bb72b-f434-4b33-8236-a17e23c3e47d	Proyecto arquitectónico	800000.00	750000.00	0.00	Desarrollo del proyecto ejecutivo	2025-07-26 07:19:47.616	2025-07-26 07:19:47.616
f6e0e935-803f-49ee-8d76-023de55b842d	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	6abb3fdd-6267-4fe4-b379-30873ae99cd5	Urbanización	3500000.00	3200000.00	0.00	Infraestructura vial y servicios	2025-07-26 07:19:47.616	2025-07-26 07:19:47.616
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.calendar_events (id, project_id, title, description, start_date, end_date, all_day, priority, assigned_to, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: capital_call_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.capital_call_items (id, capital_call_id, investor_id, requested_amount, paid_amount, paid_date, status) FROM stdin;
\.


--
-- Data for Name: capital_calls; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.capital_calls (id, project_id, call_number, total_amount, call_date, due_date, purpose, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, first_name, last_name, email, phone, address, tax_id, birth_date, occupation, monthly_income, marital_status, created_at, updated_at, identification_type, identification_number) FROM stdin;
client-001	María	González	maria.gonzalez@email.com	+57 300 123 4567	Carrera 15 #85-20, Bogotá	52123456789	\N	\N	\N	\N	2025-07-26 08:36:00.733549	2025-07-26 08:36:00.733549	cedula	
client-002	Carlos	Rodríguez	carlos.rodriguez@email.com	+57 310 987 6543	Calle 100 #15-30, Bogotá	80987654321	\N	\N	\N	\N	2025-07-26 08:36:00.733549	2025-07-26 08:36:00.733549	cedula	
client-003	Ana	Martínez	ana.martinez@email.com	+57 320 555 1234	Avenida 68 #45-67, Bogotá	41555123456	\N	\N	\N	\N	2025-07-26 08:36:00.733549	2025-07-26 08:36:00.733549	cedula	
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.documents (id, project_id, permit_id, name, file_name, file_size, mime_type, uploaded_by, category, file_path, created_at) FROM stdin;
\.


--
-- Data for Name: investors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.investors (id, name, email, phone, investor_type, tax_id, bank_account, bank_name, total_commitment, total_contributed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lots; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lots (id, project_id, lot_number, block, area, price_per_m2, total_price, status, characteristics, reserved_by, reserved_date, sold_date, created_at, updated_at) FROM stdin;
lot-001	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	L001	\N	150.00	6330.00	950000.00	disponible	Esquina noreste, vista al parque	\N	\N	\N	2025-07-26 08:35:57.705473	2025-07-26 08:35:57.705473
lot-002	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	L002	\N	120.00	6330.00	760000.00	disponible	Centro del proyecto	\N	\N	\N	2025-07-26 08:35:57.705473	2025-07-26 08:35:57.705473
lot-003	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	L003	\N	180.00	6330.00	1140000.00	disponible	Vista al parque principal	\N	\N	\N	2025-07-26 08:35:57.705473	2025-07-26 08:35:57.705473
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, contract_id, payment_number, due_date, amount, paid_amount, paid_date, payment_method, reference, status, late_fee, created_at) FROM stdin;
\.


--
-- Data for Name: permits; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permits (id, project_id, name, type, status, request_date, due_date, approval_date, cost, responsible_person, notes, created_at, updated_at) FROM stdin;
fec94a9e-6e47-4c2c-9535-b6a8bdde2744	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	Licencia de Construcción	licencia_construccion	aprobado	2024-01-10 00:00:00	\N	2024-02-15 00:00:00	150000.00	Ing. Ana García	Licencia aprobada para 24 unidades	2025-07-26 07:19:47.521	2025-07-26 07:19:47.521
0b140ae0-9b6c-40a5-b42b-7269fa8edf4b	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	Factibilidad de Servicios	factibilidad_servicios	en_revision	2024-02-01 00:00:00	2024-03-15 00:00:00	\N	85000.00	Ing. Carlos Mendoza	En proceso de revisión por la CFE	2025-07-26 07:19:47.521	2025-07-26 07:19:47.521
\.


--
-- Data for Name: project_investors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_investors (id, project_id, investor_id, participation_percentage, commitment_amount, contributed_amount, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, name, type, location, total_land_area, sellable_area, planned_units, total_budget, status, progress, start_date, end_date, description, created_at, updated_at) FROM stdin;
5670e9b8-33e6-4a13-9102-ef62cb47fc0a	Residencial Los Pinos	residencial	Av. Los Pinos 123, Ciudad de México	5000.00	4200.00	24	45000000.00	construccion	65	2024-01-15 00:00:00	\N	Desarrollo residencial de 24 unidades habitacionales con amenidades	2025-07-26 07:19:47.465	2025-07-26 07:19:47.465
\.


--
-- Data for Name: sales_contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_contracts (id, project_id, lot_id, client_id, contract_type, contract_number, total_amount, down_payment, monthly_payment, payment_term, contract_date, delivery_date, status, special_conditions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
_fl8TFMo71ifnZ-Kmx7awcqOzvPqiTLI	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-02T07:16:08.540Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "E442W__-V3XycWxjWXlwg8hEA1jJWhtI781eB0Rwnkk"}}	2025-08-02 07:16:09
44jOixL4IcjzbXp7Lfb3vjvHKE6Mu8xQ	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-02T07:16:10.289Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "Sru27vh1O7pj6AAyDSxMKJTVSUYY9cipQojq7MZBFGg"}}	2025-08-02 07:16:11
Djcs-_uHM6wm_Z65IHDQFTf3MXbmcbSW	{"cookie": {"path": "/", "secure": true, "expires": "2025-08-02T21:38:11.504Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "05f80954-4cc9-4537-bf9e-58ec95734aee", "exp": 1753569491, "iat": 1753565891, "iss": "https://replit.com/oidc", "sub": "45547572", "email": "yoshimitzu.calderon@gmail.com", "at_hash": "JOyMiq-6U9SGqD_rwGBRRg", "username": "yoshimitzucalde", "auth_time": 1753514190, "last_name": "Calderon", "first_name": "Yoshimitzu"}, "expires_at": 1753569491, "access_token": "WEV4h-UiVPBJYP22fCYeZqAjPm4UDr992XFpT5rU8MY", "refresh_token": "tqRdhlenqT9C0TN4j_mIlK3CXeRMutkqt7fYeS2W3C_"}}}	2025-08-02 22:09:30
\.


--
-- Data for Name: task_dependencies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_dependencies (id, predecessor_id, successor_id, dependency_type, lead_lag, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at, authorization_limit, department) FROM stdin;
45547572	yoshimitzu.calderon@gmail.com	Yoshimitzu	Calderon	\N	operativo	2025-07-26 07:16:31.613204	2025-07-26 07:16:31.613204	50000	\N
\.


--
-- Data for Name: wbs_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wbs_items (id, project_id, parent_id, wbs_code, name, description, level, start_date, end_date, duration, progress, budgeted_cost, actual_cost, is_milestone, is_critical, assigned_to, created_at, updated_at) FROM stdin;
wbs-001	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	\N	1.0	Diseño y Planeación	Fase inicial de diseño arquitectónico y urbanístico	1	\N	\N	90	85	120000000.00	102000000.00	f	f	\N	2025-07-26 08:36:04.927958	2025-07-26 08:36:04.927958
wbs-002	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	\N	1.1	Diseño Arquitectónico	Planos arquitectónicos y estructurales	2	\N	\N	45	100	60000000.00	58000000.00	f	f	\N	2025-07-26 08:36:04.927958	2025-07-26 08:36:04.927958
wbs-003	5670e9b8-33e6-4a13-9102-ef62cb47fc0a	\N	1.2	Diseño Urbanístico	Diseño de zonas comunes y vialidades	2	\N	\N	45	70	60000000.00	44000000.00	f	f	\N	2025-07-26 08:36:04.927958	2025-07-26 08:36:04.927958
\.


--
-- Data for Name: workflow_notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.workflow_notifications (id, workflow_id, recipient_id, notification_type, message, sent_at, read_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.workflow_steps (id, workflow_id, step_order, approver_level, assigned_approver_id, is_required, status, approved_at, rejected_at, comments, escalated_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: authority_delegations authority_delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authority_delegations
    ADD CONSTRAINT authority_delegations_pkey PRIMARY KEY (id);


--
-- Name: authorization_matrix authorization_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_matrix
    ADD CONSTRAINT authorization_matrix_pkey PRIMARY KEY (id);


--
-- Name: authorization_steps authorization_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_steps
    ADD CONSTRAINT authorization_steps_pkey PRIMARY KEY (id);


--
-- Name: authorization_workflows authorization_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_workflows
    ADD CONSTRAINT authorization_workflows_pkey PRIMARY KEY (id);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (id);


--
-- Name: budget_items budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: capital_call_items capital_call_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.capital_call_items
    ADD CONSTRAINT capital_call_items_pkey PRIMARY KEY (id);


--
-- Name: capital_calls capital_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.capital_calls
    ADD CONSTRAINT capital_calls_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: investors investors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.investors
    ADD CONSTRAINT investors_pkey PRIMARY KEY (id);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permits permits_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT permits_pkey PRIMARY KEY (id);


--
-- Name: project_investors project_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_investors
    ADD CONSTRAINT project_investors_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sales_contracts sales_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_contracts
    ADD CONSTRAINT sales_contracts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: task_dependencies task_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_dependencies
    ADD CONSTRAINT task_dependencies_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wbs_items wbs_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wbs_items
    ADD CONSTRAINT wbs_items_pkey PRIMARY KEY (id);


--
-- Name: workflow_notifications workflow_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_notifications
    ADD CONSTRAINT workflow_notifications_pkey PRIMARY KEY (id);


--
-- Name: workflow_steps workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: authority_delegations authority_delegations_delegate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authority_delegations
    ADD CONSTRAINT authority_delegations_delegate_id_fkey FOREIGN KEY (delegate_id) REFERENCES public.users(id);


--
-- Name: authority_delegations authority_delegations_delegator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authority_delegations
    ADD CONSTRAINT authority_delegations_delegator_id_fkey FOREIGN KEY (delegator_id) REFERENCES public.users(id);


--
-- Name: budget_categories budget_categories_parent_id_budget_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_parent_id_budget_categories_id_fk FOREIGN KEY (parent_id) REFERENCES public.budget_categories(id);


--
-- Name: budget_items budget_items_category_id_budget_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_category_id_budget_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.budget_categories(id);


--
-- Name: budget_items budget_items_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT budget_items_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: calendar_events calendar_events_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: calendar_events calendar_events_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: calendar_events calendar_events_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: documents documents_permit_id_permits_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_permit_id_permits_id_fk FOREIGN KEY (permit_id) REFERENCES public.permits(id);


--
-- Name: documents documents_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: documents documents_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: permits permits_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permits
    ADD CONSTRAINT permits_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: workflow_notifications workflow_notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_notifications
    ADD CONSTRAINT workflow_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: workflow_notifications workflow_notifications_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_notifications
    ADD CONSTRAINT workflow_notifications_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.authorization_workflows(id);


--
-- Name: workflow_steps workflow_steps_assigned_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_assigned_approver_id_fkey FOREIGN KEY (assigned_approver_id) REFERENCES public.users(id);


--
-- Name: workflow_steps workflow_steps_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.authorization_workflows(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

