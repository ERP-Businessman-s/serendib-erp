-- Serendib Gems ERP - sample data for the demo.
-- Run schema.sql first, then run this file.
-- Note: the Admin login user is created automatically by the server on first start
--       (see server/src/db.js ensureAdmin), so it is not inserted here.
-- This whole file is one batch (no GO), because it uses variables.

SET NOCOUNT ON;

-- ---------- Suppliers ----------
INSERT INTO dbo.Suppliers (name, contact, country) VALUES
  (N'Ratnapura Gem Traders', N'ratnapura.traders@example.lk', N'Sri Lanka'),
  (N'Mogok Fine Stones',     N'mogok.stones@example.com',     N'Myanmar'),
  (N'Global Gem Sources',    N'sales@globalgems.example',     N'Switzerland');

DECLARE @supRat INT = (SELECT supplier_id FROM dbo.Suppliers WHERE name = N'Ratnapura Gem Traders');
DECLARE @supMog INT = (SELECT supplier_id FROM dbo.Suppliers WHERE name = N'Mogok Fine Stones');
DECLARE @supGlo INT = (SELECT supplier_id FROM dbo.Suppliers WHERE name = N'Global Gem Sources');

-- ---------- Purchases (one per supplier) ----------
INSERT INTO dbo.Purchases (supplier_id, purchase_date, total_cost, status) VALUES
  (@supRat, '2026-05-10', 42000, 'Received'),
  (@supMog, '2026-05-18', 30000, 'Received'),
  (@supGlo, '2026-06-02', 66000, 'Received');

DECLARE @buyRat INT = (SELECT purchase_id FROM dbo.Purchases WHERE supplier_id = @supRat);
DECLARE @buyMog INT = (SELECT purchase_id FROM dbo.Purchases WHERE supplier_id = @supMog);
DECLARE @buyGlo INT = (SELECT purchase_id FROM dbo.Purchases WHERE supplier_id = @supGlo);

-- ---------- Employees (cutters + sales + manager) ----------
INSERT INTO dbo.Employees (name, role, department, is_cutter, join_date) VALUES
  (N'Nimal Perera',        N'Cutter',          N'Workshop',   1, '2023-02-01'),
  (N'Sunil Fernando',      N'Cutter',          N'Workshop',   1, '2024-07-15'),
  (N'Kamala Silva',        N'Sales Executive', N'Sales',      0, '2022-11-20'),
  (N'Rajitha Jayawardena', N'Manager',         N'Management', 0, '2021-06-05');

-- ---------- Customers ----------
INSERT INTO dbo.Customers (name, email, phone, address) VALUES
  (N'Anjali Ratnayake', N'anjali.r@example.com', N'+94 77 123 4567', N'Colombo 07, Sri Lanka'),
  (N'David Chen',       N'd.chen@example.com',   N'+65 8123 4567',   N'Orchard Road, Singapore'),
  (N'Fatima Al-Sabah',  N'fatima@example.com',   N'+971 50 123 4567',N'Dubai, UAE');

-- ---------- Lots (12 finished stones from the catalogue) ----------
INSERT INTO dbo.Lots
  (lot_code, name, gem_type, color, carat, cut, clarity, origin, treatment, cert_lab, cert_no,
   cost_price, sale_price, status, is_finished, image_url, supplier_id, purchase_id)
VALUES
  ('LOT-001', N'Ceylon Sapphire',       N'Sapphire',   N'Blue',   4.12, N'Cushion',  N'VS',          N'Ratnapura, Sri Lanka', N'No heat',   N'GRS',     N'GRS2024-061142', 19800, 28400, 'In Stock (finished)', 1, 'images/ceylon-sapphire.png',     @supRat, @buyRat),
  ('LOT-002', N'Burmese Ruby',          N'Ruby',       N'Red',    1.84, N'Oval',     N'VS',          N'Mogok, Burma',         N'No heat',   N'GRS',     N'GRS2024-058921', 30000, 42800, 'In Stock (finished)', 1, 'images/burmese-ruby.png',        @supMog, @buyMog),
  ('LOT-003', N'Padparadscha Sapphire', N'Padparadscha',N'Pink',  2.31, N'Oval',     N'VVS',         N'Sabaragamuwa, Sri Lanka', N'No heat',N'SSEF',    N'SSEF-119284',    27000, 38600, 'In Stock (finished)', 1, 'images/padparadscha.png',        @supRat, @buyRat),
  ('LOT-004', N'Colombian Emerald',     N'Emerald',    N'Green',  3.05, N'Emerald',  N'SI',          N'Muzo, Colombia',       N'Minor oil', N'Gubelin', N'GUB-0241127',    22700, 32400, 'In Stock (finished)', 1, 'images/colombian-emerald.png',   @supGlo, @buyGlo),
  ('LOT-005', N'Mahenge Spinel',        N'Spinel',     N'Pink',   2.78, N'Cushion',  N'VVS',         N'Mahenge, Tanzania',    N'None',      N'GRS',     N'GRS2024-059884', 13200, 18900, 'In Stock (finished)', 1, 'images/mahenge-spinel.png',      @supGlo, @buyGlo),
  ('LOT-006', N'Kashmir Sapphire',      N'Sapphire',   N'Blue',   1.94, N'Cushion',  N'VS',          N'Kashmir',              N'No heat',   N'SSEF',    N'SSEF-118041',    59000, 84500, 'In Stock (finished)', 1, 'images/kashmir-sapphire.png',    @supGlo, @buyGlo),
  ('LOT-007', N'Yellow Sapphire',       N'Sapphire',   N'Yellow', 5.42, N'Oval',     N'VVS',         N'Ratnapura, Sri Lanka', N'No heat',   N'GIA',     N'GIA-2241008',    10000, 14200, 'In Stock (finished)', 1, 'images/yellow-sapphire.png',     @supRat, @buyRat),
  ('LOT-008', N'Star Sapphire',         N'Sapphire',   N'Blue',   8.61, N'Cabochon', N'Translucent', N'Ratnapura, Sri Lanka', N'None',      N'GIA',     N'GIA-2241881',     4800,  6800, 'In Stock (finished)', 1, 'images/star-sapphire.png',       @supRat, @buyRat),
  ('LOT-009', N'Paraiba Tourmaline',    N'Tourmaline', N'Blue',   1.42, N'Oval',     N'VS',          N'Batalha, Brazil',      N'Heat',      N'GRS',     N'GRS2024-060114', 15300, 21800, 'In Stock (finished)', 1, 'images/paraiba-tourmaline.png',  @supGlo, @buyGlo),
  ('LOT-010', N'Tsavorite Garnet',      N'Garnet',     N'Green',  2.04, N'Cushion',  N'VVS',         N'Merelani, Tanzania',   N'None',      N'GIA',     N'GIA-2242118',     2900,  4200, 'In Stock (finished)', 1, 'images/tsavorite-garnet.png',    @supGlo, @buyGlo),
  ('LOT-011', N'Cat''s Eye Chrysoberyl',N'Chrysoberyl',N'Yellow', 3.64, N'Cabochon', N'Translucent', N'Ratnapura, Sri Lanka', N'None',      N'GIA',     N'GIA-2241944',     2200,  3200, 'In Stock (finished)', 1, 'images/cats-eye.png',            @supRat, @buyRat),
  ('LOT-012', N'Alexandrite',           N'Alexandrite',N'Multi',  1.21, N'Cushion',  N'VS',          N'Hematita, Brazil',     N'None',      N'Gubelin', N'GUB-0241409',    18500, 26400, 'In Stock (finished)', 1, 'images/alexandrite.png',         @supGlo, @buyGlo);

-- ---------- Two rough lots, so the Cutting module has something to work on ----------
INSERT INTO dbo.Lots
  (lot_code, name, gem_type, color, carat, cut, clarity, origin, treatment, cost_price, sale_price, status, is_finished, supplier_id, purchase_id)
VALUES
  ('LOT-013', N'Rough Blue Sapphire', N'Sapphire', N'Blue',  6.80, NULL, NULL, N'Ratnapura, Sri Lanka', N'None', 8000, 0, 'In Stock (rough)', 0, @supRat, @buyRat),
  ('LOT-014', N'Rough Pink Spinel',   N'Spinel',   N'Pink',  4.10, NULL, NULL, N'Mahenge, Tanzania',    N'None', 5000, 0, 'In Stock (rough)', 0, @supGlo, @buyGlo);

SET NOCOUNT OFF;
