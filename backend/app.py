from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import redis
import pika
import json
import time

import os
from config import DATABASE_URL, REDIS_HOST, REDIS_PORT, RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Redis connection
def get_redis_connection():
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# PostgreSQL connection
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn

# RabbitMQ connection
def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
    )
    return connection

# Create RabbitMQ channel and declare queue
def setup_rabbitmq():
    retries = 5
    while retries > 0:
        try:
            connection = get_rabbitmq_connection()
            channel = connection.channel()
            channel.queue_declare(queue='orders', durable=True)
            connection.close()
            print("RabbitMQ setup completed successfully")
            return
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            retries -= 1
            time.sleep(5)
    
    print("Could not connect to RabbitMQ after multiple attempts")

# Wait for services to be ready
def wait_for_services():
    # Wait for PostgreSQL
    retries = 5
    while retries > 0:
        try:
            conn = get_db_connection()
            conn.close()
            print("PostgreSQL is ready")
            break
        except Exception as e:
            print(f"PostgreSQL is not ready yet: {e}")
            retries -= 1
            time.sleep(5)
    
    # Wait for Redis
    retries = 5
    while retries > 0:
        try:
            redis_client = get_redis_connection()
            redis_client.ping()
            print("Redis is ready")
            break
        except Exception as e:
            print(f"Redis is not ready yet: {e}")
            retries -= 1
            time.sleep(5)

@app.before_first_request
def before_first_request():
    wait_for_services()
    setup_rabbitmq()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

# @app.route('/api/products', methods=['GET'])
# def get_products():
#     # Try to get products from Redis cache
#     redis_client = get_redis_connection()
#     cached_products = redis_client.get('products')
    
#     if cached_products:
#         print("Using cached product data")
#         return jsonify({"products": json.loads(cached_products)})
    
#     try:
#         conn = get_db_connection()
#         cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
#         cursor.execute("SELECT * FROM products")
#         products = cursor.fetchall()
        
#         # Convert products to a list of dictionaries
#         products_list = []
#         for product in products:
#             products_list.append({
#                 "id": product['id'],
#                 "name": product['name'],
#                 "description": product['description'],
#                 "price": float(product['price']),
#                 "stock": product['stock']
#             })
        
#         # Cache the products in Redis with a 5-minute expiration
#         redis_client.setex('products', 300, json.dumps(products_list))
        
#         return jsonify({"products": products_list})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()


@app.route('/api/products', methods=['GET'])
def get_products():
    redis_client = get_redis_connection()
    cached_products = redis_client.get('products')

    if cached_products:
        print("Using cached product data")
        return jsonify({"products": json.loads(cached_products)})

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()

        products_list = [
            {
                "id": product["id"],
                "name": product["name"],
                "description": product["description"],
                "price": float(product["price"]),
                "stock": product["stock"]
            }
            for product in products
        ]

        redis_client.setex('products', 300, json.dumps(products_list))
        return jsonify({"products": products_list})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    
    if not data or not data.get('customer_name') or not data.get('customer_email') or not data.get('items'):
        return jsonify({"error": "Missing required order information"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Insert order
        cursor.execute(
            "INSERT INTO orders (customer_name, customer_email, status) VALUES (%s, %s, %s) RETURNING id",
            (data['customer_name'], data['customer_email'], 'pending')
        )
        order_id = cursor.fetchone()['id']
        
        # Check stock and insert order items
        total_price = 0
        for item in data['items']:
            cursor.execute(
                "SELECT price, stock FROM products WHERE id = %s", 
                (item['product_id'],)
            )
            product = cursor.fetchone()
            
            if not product:
                return jsonify({"error": f"Product with ID {item['product_id']} not found"}), 404
            
            if product['stock'] < item['quantity']:
                return jsonify({"error": f"Not enough stock for product ID {item['product_id']}"}), 400
            
            # Update stock
            cursor.execute(
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (item['quantity'], item['product_id'])
            )
            
            # Insert order item
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                (order_id, item['product_id'], item['quantity'], product['price'])
            )
            
            total_price += float(product['price']) * item['quantity']
        
        # Invalidate product cache
        redis_client = get_redis_connection()
        redis_client.delete('products')
        
        # Send order to RabbitMQ
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
        order_message = {
            "order_id": order_id,
            "customer_name": data['customer_name'],
            "total_price": total_price
        }
        
        channel.basic_publish(
            exchange='',
            routing_key='orders',
            body=json.dumps(order_message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            )
        )
        
        connection.close()
        
        return jsonify({"order_id": order_id, "status": "pending"}), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get order information
        cursor.execute(
            """
            SELECT o.id, o.customer_name, o.status, o.created_at
            FROM orders o
            WHERE o.id = %s
            """,
            (order_id,)
        )
        order = cursor.fetchone()
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Get order items
        cursor.execute(
            """
            SELECT oi.product_id, p.name as product_name, oi.quantity, oi.unit_price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
            """,
            (order_id,)
        )
        items = cursor.fetchall()
        
        # Calculate total
        total = sum(float(item['unit_price']) * item['quantity'] for item in items)
        
        # Format response
        order_data = {
            "order_id": order['id'],
            "customer_name": order['customer_name'],
            "status": order['status'],
            "created_at": order['created_at'].isoformat(),
            "items": [
                {
                    "product_id": item['product_id'],
                    "product_name": item['product_name'],
                    "quantity": item['quantity'],
                    "unit_price": float(item['unit_price']),
                    "total_price": float(item['unit_price']) * item['quantity']
                }
                for item in items
            ],
            "total": total
        }
        
        return jsonify(order_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)