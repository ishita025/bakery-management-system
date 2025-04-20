-- Create tables
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- Insert sample products
INSERT INTO products (name, description, price, stock) VALUES
('Almond Delight Cake', 'Rich almond sponge cake topped with roasted almonds', 5.75, 40),
('Italian Garlic Bread', 'Crusty bread with a buttery garlic herb spread', 3.00, 35),
('Strawberry Danish', 'Flaky pastry filled with strawberry jam and custard', 3.50, 50),
('Multigrain Sandwich Loaf', 'Healthy multigrain loaf perfect for sandwiches', 4.00, 30),
('Vanilla Cream Donut', 'Soft donut filled with vanilla custard and sugar glaze', 2.95, 45),
('Mango Mousse Cup', 'Chilled mango mousse served in a dessert cup', 4.50, 25),
('Cold Coffee Frappe', 'Chilled coffee blended with ice and chocolate drizzle', 3.25, 20),
('Hazelnut Crunch Tart', 'Hazelnut tart with chocolate ganache and crunchy base', 5.00, 20);

