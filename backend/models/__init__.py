from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Product model
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Numeric(5, 2), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': str(self.price)
        }

# Order model
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'status': self.status
        }

# Initialization function
def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
