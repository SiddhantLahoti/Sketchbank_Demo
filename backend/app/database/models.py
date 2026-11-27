# backend/app/database/models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON , Table , LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime , timezone , date
from .database import Base
from sqlalchemy import Date , DateTime

# --- 1. USER AUTHENTICATION & ROLES ---

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role")


# --- 2. INGESTION & CROPPING PIPELINE ---

class UploadedPDF(Base):
    __tablename__ = "uploaded_pdfs"
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class CroppedProduct(Base):
    __tablename__ = "cropped_products"
    id = Column(Integer, primary_key=True, index=True)
    pdf_id = Column(Integer, ForeignKey("uploaded_pdfs.id"))
    page_number = Column(Integer)
    cropped_image_path = Column(String, nullable=False)
    debug_image_path = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING or ACTIVE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_metadata = relationship("ProductMetadata", back_populates="cropped_product", uselist=False)


# --- 3. MASTER DROPDOWN TABLES ---

class MainCategory(Base):
    __tablename__ = "main_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    short_code = Column(String(20), nullable=True)  # e.g., Ring -> R, Earring -> E

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    main_category_id = Column(Integer, ForeignKey("main_categories.id"))
    short_code = Column(String(20), nullable=True)  # e.g., HP

class Subcategory1(Base):
    __tablename__ = "subcategories_1"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))

class Subcategory2(Base):
    __tablename__ = "subcategories_2"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))

class DiamondType(Base):
    __tablename__ = "diamond_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Shape(Base):
    __tablename__ = "shapes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Cut(Base):
    __tablename__ = "cuts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Market(Base):
    __tablename__ = "markets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class MetalType(Base):
    __tablename__ = "metal_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Designer(Base):
    __tablename__ = "designers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class ColourStone(Base):
    __tablename__ = "colour_stones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)


# --- 4. MULTI-SELECT ASSOCIATION TABLES ---

product_category_table = Table(
    "product_category", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"))
)

product_subcategory1_table = Table(
    "product_subcategory1", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("subcategory1_id", Integer, ForeignKey("subcategories_1.id", ondelete="CASCADE"))
)

product_subcategory2_table = Table(
    "product_subcategory2", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("subcategory2_id", Integer, ForeignKey("subcategories_2.id", ondelete="CASCADE"))
)

product_shape_table = Table(
    "product_shape", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("shape_id", Integer, ForeignKey("shapes.id", ondelete="CASCADE"))
)

product_cut_table = Table(
    "product_cut", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("cut_id", Integer, ForeignKey("cuts.id", ondelete="CASCADE"))
)

product_colour_stone_table = Table(
    "product_colour_stone", Base.metadata,
    Column("product_id", Integer, ForeignKey("product_metadata.id", ondelete="CASCADE")),
    Column("colour_stone_id", Integer, ForeignKey("colour_stones.id", ondelete="CASCADE"))
)


# --- 5. PRODUCT METADATA ---



class ProductMetadata(Base):
    __tablename__ = "product_metadata"

    id = Column(Integer, primary_key=True, index=True)
    cropped_product_id = Column(Integer, ForeignKey("cropped_products.id"), unique=True)

    # 1. Identity, Initiation & Designers
    sketch_number = Column(String(100), unique=True, index=True, nullable=True)
    style_number = Column(String(100), index=True, nullable=False)
    initiation_type = Column(String(50), default="Internal")        # Internal / Customer
    initiation_trigger = Column(String(100), nullable=True)        # Merchandiser, BDM, etc.
    creative_designer = Column(String(100), nullable=True)
    concept_designer_1 = Column(String(100), nullable=True)
    concept_designer_2 = Column(String(100), nullable=True)

    # 2. Hierarchical Classifications
    main_category = Column(String(100), nullable=False, default="Ring")
    categories = Column(JSON, default=list)         # Stores list of tags up to 3
    subcategory_1 = Column(JSON, default=list)      # Stores list of tags up to 3
    subcategory_2 = Column(JSON, default=list)      # Stores list of tags up to 3

    # 3. Metal, Diamond & Gemstones
    metal_type = Column(String(100), nullable=True, default="Yellow gold")
    metal_weight = Column(Float, nullable=True)
    diamond_type = Column(String(100), nullable=True, default="LGD")
    diamond_weight = Column(Float, nullable=True)
    shapes = Column(JSON, default=list)             # Stores up to 3 shapes
    cuts = Column(JSON, default=list)               # Stores up to 3 cuts
    colour_stones = Column(JSON, default=list)      # Stores up to 3 gemstones

    # 4. Designer Total Weight Lineage
    total_weight_designer_1 = Column(String(100), nullable=True)
    total_weight_1 = Column(Float, nullable=True)
    total_weight_designer_2 = Column(String(100), nullable=True)
    total_weight_2 = Column(Float, nullable=True)

    # 5. Commercial Scope & Exclusivity
    customer_name = Column(String(100), nullable=True)
    customer_number = Column(String(100), nullable=True)
    market = Column(String(50), nullable=True)
    is_exclusive = Column(Boolean, default=False)
    is_backlog = Column(Boolean, default=False)

    # 6. Collection Context & Team Notes
    collection = Column(String(200), nullable=True)
    remarks = Column(Text, nullable=True)

    # 7. Asset Tracking Flags
    assets = Column(JSON, default=dict)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=datetime.utcnow)

    # Relationships
    cropped_product = relationship("CroppedProduct", back_populates="product_metadata")
    attachments = relationship("ProductAttachment", back_populates="product", cascade="all, delete-orphan")

    serial_number = Column(Integer, nullable=True, index=True)
    sketch_date = Column(Date, default=date.today, nullable=False)
    grade = Column(String(20), nullable=True)  # Easy, Medium, Hard




class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
class CustomerNumber(Base):
    __tablename__ = "customer_numbers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
      

# --- 6. PRODUCTION FILE ATTACHMENTS (Section 7 Views) ---

class ProductAttachment(Base):
    __tablename__ = "product_attachments"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product_metadata.id", ondelete="CASCADE"))
    attachment_type = Column(String, nullable=False) # "Side View", "3D View", "Coral", "CAD", "Final Photo"
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    product = relationship("ProductMetadata", back_populates="attachments")


# --- 7. AUDIT LOGS (Tab 7 & Reports) ---

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # ACTIVATE_SKETCH, UPDATE_METADATA, UPLOAD_PDF
    style_number = Column(String(100), nullable=True, index=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    
class ProductEmbedding(Base):
    __tablename__ = "product_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    cropped_product_id = Column(Integer, ForeignKey("cropped_products.id", ondelete="CASCADE"), unique=True)
    embedding_vector = Column(LargeBinary, nullable=False) 
    model_version = Column(String(50), default="resnet50-v1")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cropped_product = relationship("CroppedProduct")