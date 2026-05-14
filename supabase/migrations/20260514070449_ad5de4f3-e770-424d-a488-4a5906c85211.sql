
CREATE TABLE public.solar_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_number integer NOT NULL,
  battery_type text NOT NULL DEFAULT 'lithium',
  inverter text NOT NULL,
  inverter_price numeric,
  solar_panels text NOT NULL,
  solar_panels_price numeric,
  battery text NOT NULL,
  battery_price numeric,
  charge_controller text NOT NULL DEFAULT 'NIL',
  charge_controller_price numeric,
  accessories_price numeric,
  setup_fee numeric,
  total_price numeric NOT NULL,
  appliances text NOT NULL,
  tagline text,
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solar_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active solar packages"
  ON public.solar_packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins full access on solar packages"
  ON public.solar_packages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_solar_packages_updated_at
  BEFORE UPDATE ON public.solar_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.solar_packages
  (package_number, battery_type, inverter, inverter_price, solar_panels, solar_panels_price, battery, battery_price, charge_controller, charge_controller_price, accessories_price, setup_fee, total_price, appliances, tagline, badge, sort_order)
VALUES
  (1,'lithium','Hybrid 3.5KVA 24V (Transformer-Based)',650000,'450W Panels x 8',1056000,'5kWh 24/48V x 1',1650000,'60Amp MPPT',198000,158000,312200,4024000,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','For small homes & flats','Starter',1),
  (2,'lithium','Hybrid 5KVA 24V/48V (Transformer-Based)',1105000,'450W Panels x 12',1584000,'7.2kWh 24/48V x 1',1950000,'NIL',NULL,224000,486300,5349300,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','For mid-sized homes','Popular',2),
  (3,'lithium','Hybrid 7.5KVA 48V (Transformer-Based)',1170000,'450W Panels x 18',2376000,'10kWh 24/48V x 1',2730000,'NIL',NULL,396000,667200,7339200,'36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC','Adds AC support','Family',3),
  (4,'lithium','Hybrid 10KVA 48V (Transformer-Based)',1690000,'450W Panels x 24',3168000,'15kWh 48/54V x 1',4160000,'120Amp MPPT',348000,510000,952800,10828800,'40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 2x 1HP AC','Large home / dual AC','Premium',4),
  (5,'lithium','Hybrid 10KVA (3 Phase) 48V (Transformer-Based)',1690000,'450W Panels x 24',3168000,'17kWh 48/54V x 1',5200000,'120Amp MPPT',348000,672000,1107800,12185800,'80 Bulbs, 12 Fans, 10 TVs, 10 Laptops, 4 Freezers, 3x 1HP AC','3-phase office / large home','3-Phase',5),
  (6,'lithium','Hybrid 10KVA (3 Phase) 48V (Transformer-Based)',1690000,'450W Panels x 28',3696000,'20kWh (10kWh 48/54V x 2)',5460000,'120Amp MPPT',348000,672000,1186600,13052600,'80 Bulbs, 12 Fans, 10 TVs, 10 Laptops, 4 Freezers, 3x 1HP AC','Extended runtime','Extended',6),
  (7,'lithium','Hybrid 20KVA (10KVA x 2) 48V (Transformer-Based)',3380000,'650W Panels x 32',5376000,'30kWh (15kWh 48/54V x 2)',8320000,'120Amp MPPT x 2',696000,1176000,1860000,20808000,'100 Bulbs, 15 Fans, 15 TVs, 15 Laptops, 5 Freezers, 4x 1HP AC','Small business / villa','Business',7),
  (8,'lithium','Hybrid 30KVA (10KVA x 3) 48V/74V (Transformer-Based)',5070000,'650W Panels x 48',8064000,'70kWh (17.5kWh 48/54V x 4)',20800000,'120Amp MPPT x 3',1044000,1848000,3682800,40508800,'200 Bulbs, 18 Fans, 20 TVs, 20 Laptops, 6 Freezers, 5x 1HP AC','Enterprise / estate','Enterprise',8),
  (9,'tubular','Hybrid 1KVA (12V/24V)',228000,'400W Panels x 2',221000,'220AH x 1',282000,'60Amp MPPT',198000,90000,106200,1125200,'9 Bulbs, 2 Fans, 2 TVs, 2 Laptops','Studio / shop starter','Starter',9),
  (10,'tubular','Hybrid 1.5KVA/1.7KVA (12V/24V)',247000,'400W Panels x 2',221000,'220AH x 2',564000,'60Amp MPPT',198000,120000,169500,1519500,'14 Bulbs, 3 Fans, 3 TVs, 3 Laptops','Small flat','Compact',10),
  (11,'tubular','Hybrid 2.5KVA/3.5KVA (24V)',560000,'450W Panels x 4',530000,'220AH x 2',546000,'60Amp MPPT',198000,132000,250800,2216000,'18 Bulbs, 4 Fans, 3 TVs, 3 Laptops','Mid flat / small home','Popular',11),
  (12,'tubular','Hybrid 3KVA (24V) (Transformer-less)',590000,'450W Panels x 8',1056000,'220AH x 4',1128000,'60Amp MPPT',198000,158000,312200,3442200,'30 Bulbs, 5 Fans, 4 TVs, 4 Laptops, 1 Freezer','Family home','Family',12),
  (13,'tubular','Hybrid 5KVA (24V/48V) (Transformer-Based)',1105000,'450W Panels x 12',1584000,'220AH x 6',1692000,'80Amp MPPT',240500,224000,450440,5295940,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','Larger family home','Premium',13),
  (14,'tubular','Hybrid 5KVA (24V/48V) (Transformer-less)',585000,'450W Panels x 12',1584000,'220AH x 6',1692000,'80Amp MPPT',240500,224000,450440,4775940,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','Best value 5KVA','Value',14),
  (15,'tubular','Non-Hybrid 7.5KVA (Transformer-Based) 48V',1235000,'450W Panels x 18',2376000,'220AH x 8',2256000,'100Amp MPPT',312000,396000,678000,7253000,'36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC','Home + AC','Home+AC',15),
  (16,'tubular','Non-Hybrid 10KVA (Transformer-Based) 48V',1690000,'450W Panels x 24',3168000,'220AH x 16',4512000,'120Amp MPPT',375000,510000,1029000,11284000,'40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 2x 1HP AC','Large home / dual AC','Premium',16);
