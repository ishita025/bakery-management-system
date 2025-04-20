# Bakery Management System

A containerized bakery management system implemented using Docker, featuring a PostgreSQL database, a Python Flask backend, a React frontend, and RabbitMQ message queue.

## System Architecture Overview

The system consists of the following components:

1. **PostgreSQL Database**: Stores product information, orders, and order items.
2. **Redis Cache**: Provides caching for product listings to improve performance.
3. **Backend API Service (Python Flask)**: Provides APIs for listing products, placing orders, and checking order status.
4. **Frontend Web Application (React)**: User interface for customers to browse products, place orders, and check order status.
5. **RabbitMQ Message Queue**: Facilitates asynchronous processing of orders.
6. **Worker Service**: Processes orders from the RabbitMQ queue and updates their status.

### Architecture Diagram

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│   Frontend  │───────▶│   Backend    │───────▶│  PostgreSQL  │
│   (React)   │◀───────│   (Flask)    │◀───────│  Database    │
└─────────────┘        └───────┬──────┘        └──────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌────────────┐    ┌────────────┐
              │  RabbitMQ  │    │    Redis   │
              │  Message   │    │    Cache   │
              │   Queue    │    │            │
              └──────┬─────┘    └────────────┘
                     │
                     ▼
              ┌────────────┐
              │   Worker   │
              │  Service   │
              └────────────┘
```

## Setup Instructions

### Prerequisites

- Docker Engine (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)

### Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/ishita025/bakery-management-system.git
   cd bakery-management-system
   ```

2. Configure environment variables (optional):
   ```
   # Edit the .env file if needed
   nano .env
   ```

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Verify all services are running:
   ```
   docker-compose ps
   ```

5. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000/api
   - RabbitMQ Management: http://localhost:15672 (username: guest, password: guest)

### Stopping the Application

```
docker-compose down
```

To remove all data volumes:
```
docker-compose down -v
```

## API Documentation

### List All Bakery Products

- **URL:** `/api/products`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "products": [
      {
        "id": 1,
        "name": "Chocolate Croissant",
        "description": "Buttery croissant with chocolate filling",
        "price": 3.50,
        "stock": 50
      },
      ...
    ]
  }
  ```

### Place an Order

- **URL:** `/api/orders`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      },
      {
        "product_id": 3,
        "quantity": 1
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "order_id": 1,
    "status": "pending"
  }
  ```

### Check Order Status

- **URL:** `/api/orders/{order_id}`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "order_id": 1,
    "customer_name": "John Doe",
    "status": "completed",
    "created_at": "2023-03-15T14:30:45.123456",
    "items": [
      {
        "product_id": 1,
        "product_name": "Chocolate Croissant",
        "quantity": 2,
        "unit_price": 3.50,
        "total_price": 7.00
      },
      {
        "product_id": 3,
        "product_name": "Blueberry Muffin",
        "quantity": 1,
        "unit_price": 2.75,
        "total_price": 2.75
      }
    ],
    "total": 9.75
  }
  ```

## Advanced Features Implemented

### 1. Redis Caching

The backend service utilizes Redis to cache product listings, improving response times for frequently accessed data. When a user requests the list of products, the system first checks if the data is available in the cache. If it is, the cached data is returned without querying the database. If not, the system retrieves the data from the database, stores it in the cache, and then returns it to the user.

The cache is invalidated whenever a product's stock changes due to an order being placed, ensuring that users always see up-to-date information.

### 2. Worker Service with RabbitMQ

The system implements a worker service that processes orders asynchronously through a RabbitMQ message queue. When an order is placed, the backend service publishes a message to the queue and returns an immediate response to the user. The worker service then consumes the message, simulates processing time, and updates the order status in the database.

This approach improves system scalability and responsiveness, as the backend service can handle more incoming requests without being blocked by order processing. Additionally, the worker service can be scaled independently based on the order processing load.

## Container Resource Management

Resource limits have been set for all services to prevent any single container from consuming too many resources. This improves system stability and ensures fair resource allocation. The limits are defined in the docker-compose.yml file for each service.

## Health Monitoring

Health checks have been implemented for all services to ensure system reliability. Docker will automatically restart any container that fails its health check, minimizing downtime. The health checks verify that each service is functioning correctly before the dependent services attempt to connect to it.

## Design Decisions

### Database Schema

The database schema consists of three main tables:
- **products**: Stores information about available bakery products
- **orders**: Stores customer order information
- **order_items**: Stores the relationship between orders and products, including quantities

This normalized structure allows for efficient data storage and retrieval while maintaining data integrity.

### Caching Strategy

Redis was chosen for caching due to its high performance and flexibility. The caching strategy involves:
- Caching product listings with a 5-minute expiration
- Cache invalidation when product stock changes
- Fallback to database queries when cache is unavailable

### Asynchronous Processing

The decision to use RabbitMQ for asynchronous order processing was based on:
- Improved user experience through immediate order confirmation
- Better system scalability by decoupling order placement from processing
- Enhanced reliability through message persistence and retry mechanisms

### Container Configuration

Resource limits were configured based on typical usage patterns:
- Backend service: Higher CPU and memory allocation for API processing
- Frontend: Lower resource allocation as it serves static content
- Worker: Moderate resource allocation for background processing

### Security Considerations

While this is a demonstration system, several security best practices have been implemented:
- Environment variables for sensitive configuration
- Container isolation with proper networking
- Health checks to ensure service availability

## Future Improvements

- Add user authentication and authorization
- Implement HTTPS for secure communication
- Add admin panel for bakery management
- Implement payment processing integration
- Add more detailed metrics and monitoring
- Implement database backups and disaster recovery
- Add CI/CD pipeline for automated testing and deployment
