-- Usuarios
CREATE TABLE IF NOT EXISTS "User" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL
);

-- Función para registrar usuarios
CREATE OR REPLACE FUNCTION register_user(
  new_username VARCHAR,
  new_password VARCHAR,
  new_role VARCHAR
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE username = new_username) THEN
    RAISE EXCEPTION 'Username ya existe';
  END IF;

  INSERT INTO "User"(username, password, role)
  VALUES (new_username, new_password, new_role)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Restaurantes
CREATE TABLE IF NOT EXISTS "Restaurant" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(200)
);

-- Menús
CREATE TABLE IF NOT EXISTS "Menu" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  id_restaurant INT NOT NULL,
  FOREIGN KEY (id_restaurant) REFERENCES "Restaurant"(id) ON DELETE CASCADE
);

-- Productos
CREATE TABLE IF NOT EXISTS "Product" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

-- Relación entre productos y menús
CREATE TABLE IF NOT EXISTS "ProductMenu" (
  id_product INT,
  id_menu INT,
  PRIMARY KEY (id_product, id_menu),
  FOREIGN KEY (id_product) REFERENCES "Product"(id) ON DELETE CASCADE,
  FOREIGN KEY (id_menu) REFERENCES "Menu"(id) ON DELETE CASCADE
);

-- Mesas
CREATE TABLE IF NOT EXISTS "Table" (
  id SERIAL PRIMARY KEY,
  number INT NOT NULL,
  capacity INT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  id_restaurant INT NOT NULL,
  FOREIGN KEY (id_restaurant) REFERENCES "Restaurant"(id) ON DELETE CASCADE
);

-- Reservas
CREATE TABLE IF NOT EXISTS "Reservation" (
  id SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  id_table INT NOT NULL,
  reservation_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  FOREIGN KEY (id_user) REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY (id_table) REFERENCES "Table"(id) ON DELETE CASCADE
);

-- Pedidos
CREATE TABLE IF NOT EXISTS "Order" (
  id SERIAL PRIMARY KEY,
  id_user INT NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES "User"(id) ON DELETE CASCADE
);

-- Relación entre pedidos y productos
CREATE TABLE IF NOT EXISTS "OrderProduct" (
  id_order INT,
  id_product INT,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id_order, id_product),
  FOREIGN KEY (id_order) REFERENCES "Order"(id) ON DELETE CASCADE,
  FOREIGN KEY (id_product) REFERENCES "Product"(id) ON DELETE CASCADE
);


CREATE OR REPLACE FUNCTION update_user(
  user_id INT,
  new_username VARCHAR,
  new_password VARCHAR,
  new_role VARCHAR
)
RETURNS TEXT AS $$
BEGIN
  UPDATE "User"
  SET username = new_username,
      password = new_password,
      role = new_role
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  RETURN 'Usuario actualizado correctamente';
END;
$$ LANGUAGE plpgsql;


-- ELIMINAR USUARIO
CREATE OR REPLACE FUNCTION delete_user(p_id INT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM "User" WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION register_restaurant(
  new_name VARCHAR,
  new_capacity INT,
  new_location VARCHAR,
  new_table_count INT
)
RETURNS INT AS $$
DECLARE
  v_id INT;
  i INT;
BEGIN
  -- Crear el restaurante
  INSERT INTO "Restaurant"(name, capacity, location)
  VALUES (new_name, new_capacity, new_location)
  RETURNING id INTO v_id;

  -- Crear las mesas
  FOR i IN 1..new_table_count LOOP
    INSERT INTO "Table"(number, capacity, available, id_restaurant)
    VALUES (i, 4, TRUE, v_id);
  END LOOP;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION list_restaurants()
RETURNS TABLE (
  id INT,
  name VARCHAR,
  capacity INT,
  location VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.capacity, r.location
  FROM "Restaurant" r;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_menu(
  new_name VARCHAR,
  restaurant_id INT
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO "Menu"(name, id_restaurant)
  VALUES (new_name, restaurant_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_menu_by_id(p_id INT)
RETURNS TABLE(id INT, name VARCHAR, id_restaurant INT) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.id_restaurant
  FROM "Menu" m
  WHERE m.id = p_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_menu(
  p_id INT,
  new_name VARCHAR,
  new_id_restaurant INT
)
RETURNS TEXT AS $$
BEGIN
  UPDATE "Menu"
  SET name = new_name,
      id_restaurant = new_id_restaurant
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Menú no encontrado';
  END IF;

  RETURN 'Menú actualizado correctamente';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_menu(p_id INT)
RETURNS TEXT AS $$
BEGIN
  DELETE FROM "Menu" WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Menú no encontrado';
  END IF;

  RETURN 'Menú eliminado correctamente';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_reservation(
  p_user_id INT,
  p_table_id INT,
  p_reservation_time TIMESTAMP
)
RETURNS INT AS $$
DECLARE
  v_id INT;
  v_exists BOOLEAN;
BEGIN
  -- Validar existencia de usuario
  SELECT EXISTS(SELECT 1 FROM "User" WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'El usuario no existe';
  END IF;

  -- Validar existencia de mesa
  SELECT EXISTS(SELECT 1 FROM "Table" WHERE id = p_table_id AND available = TRUE) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'La mesa no existe o no está disponible';
  END IF;

  -- Crear reserva
  INSERT INTO "Reservation"(id_user, id_table, reservation_time)
  VALUES (p_user_id, p_table_id, p_reservation_time)
  RETURNING id INTO v_id;

  -- Marcar mesa como no disponible
  UPDATE "Table" SET available = FALSE WHERE id = p_table_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION cancel_reservation(p_id INT)
RETURNS TEXT AS $$
DECLARE
  v_table_id INT;
BEGIN
  -- Obtener ID de la mesa asociada
  SELECT id_table INTO v_table_id FROM "Reservation" WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  -- Eliminar reserva
  DELETE FROM "Reservation" WHERE id = p_id;

  -- Marcar la mesa como disponible nuevamente
  UPDATE "Table" SET available = TRUE WHERE id = v_table_id;

  RETURN 'Reserva cancelada correctamente';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION create_order(
  p_user_id INT,
  p_total NUMERIC
)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  -- Validar existencia de usuario
  IF NOT EXISTS(SELECT 1 FROM "User" WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'El usuario no existe';
  END IF;

  -- Crear orden
  INSERT INTO "Order"(id_user, total)
  VALUES (p_user_id, p_total)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_order_details(p_id INT)
RETURNS TABLE (
  id INT,
  id_user INT,
  total NUMERIC,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.id_user, o.total, o.created_at
  FROM "Order" o
  WHERE o.id = p_id;
END;
$$ LANGUAGE plpgsql;
