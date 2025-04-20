import pika
import json
import time
import psycopg2
import os
import random
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://bakery_admin:bakery_password@db:5432/bakery_db')

# RabbitMQ configuration
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'rabbitmq')
RABBITMQ_PORT = int(os.environ.get('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.environ.get('RABBITMQ_DEFAULT_USER', 'guest')
RABBITMQ_PASS = os.environ.get('RABBITMQ_DEFAULT_PASS', 'guest')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn

def update_order_status(order_id, status):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET status = %s WHERE id = %s",
            (status, order_id)
        )
        cursor.close()
        conn.close()
        logger.info(f"Updated order {order_id} status to {status}")
    except Exception as e:
        logger.error(f"Error updating order status: {e}")

def process_order(order_data):
    order_id = order_data['order_id']
    
    # Update status to processing
    update_order_status(order_id, 'processing')
    
    # Simulate processing time (random between 5-15 seconds)
    processing_time = random.randint(5, 15)
    logger.info(f"Processing order {order_id} (will take {processing_time} seconds)")
    time.sleep(processing_time)
    
    # Update status to completed
    update_order_status(order_id, 'completed')
    logger.info(f"Order {order_id} has been completed")

def callback(ch, method, properties, body):
    logger.info(f"Received message: {body}")
    try:
        order_data = json.loads(body)
        process_order(order_data)
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        # Negative acknowledgment to requeue the message
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    # Wait for RabbitMQ to be ready
    retries = 30
    while retries > 0:
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    credentials=credentials,
                    heartbeat=600
                )
            )
            channel = connection.channel()
            
            # Declare queue
            channel.queue_declare(queue='orders', durable=True)
            
            # Set prefetch count
            channel.basic_qos(prefetch_count=1)
            
            # Register consumer
            channel.basic_consume(queue='orders', on_message_callback=callback)
            
            logger.info("Worker started. Waiting for messages...")
            channel.start_consuming()
            
            break
        except Exception as e:
            logger.warning(f"Failed to connect to RabbitMQ: {e}")
            retries -= 1
            time.sleep(5)
    
    if retries == 0:
        logger.error("Could not connect to RabbitMQ after multiple attempts")

if __name__ == '__main__':
    main()