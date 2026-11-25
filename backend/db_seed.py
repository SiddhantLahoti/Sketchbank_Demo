# backend/db_seed.py
from passlib.context import CryptContext
from app.database.database import SessionLocal
from app.database import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CASCADE_DATA = {
    "Ring": {
        "Wedding Band": {"sub1": ["1/2 eternity", "full eternity"], "sub2": ["Classic", "Baguette", "Vintage", "TM", "Colour Diamond", "Colour Stone"]},
        "Anniversary Band": {"sub1": ["1/2 eternity", "full eternity"], "sub2": ["Classic", "Baguette", "Vintage", "Fancy shape diamond", "TM", "Colour Diamond", "Colour Stone"]},
        "Bands": {"sub1": ["5 stone", "7 stone", "9 stone"], "sub2": ["fancy shape diamond", "TM"]},
        "Fashion Bands": {"sub1": ["Full Eternity", "Half Eternity", "Stackable", "broad", "Basic"], "sub2": ["Basic", "Baguette", "Fancy Shape of Diamond", "TM", "Colour Diamond", "Colour Stone", "Chevron", "bold gold", "rope / texture", "cross over / over under / twist", "cross", "heart", "infinity", "alphabet", "zodiac", "hamsa", "butterfly"]},
        "Bridal Set": {"sub1": ["Sol", "Sol+", "Single Stone", "3 stone", "Cluster", "Composite", "Multistone", "Quad", "Fancy"], "sub2": ["Classic", "Vintage", "Single Halo", "Double Halo", "Semimount", "Baguette", "Hidden Halo", "fancy shape diamond", "fancy", "Texture", "TM", "Colour Diamond", "Colour Stone", "Color Stone"]},
        "Trio Bridal Set": {"sub1": ["Sol", "Sol+", "Single Stone", "3 stone", "Cluster", "Composite", "Multistone", "Quad", "Fancy"], "sub2": ["Classic", "Vintage", "Single Halo", "Double Halo", "Semimount", "Baguette", "Hidden Halo", "fancy shape diamond", "fancy", "Texture", "TM", "Colour Diamond", "Colour Stone", "Color Stone"]},
        "Quin Bridal Set": {"sub1": ["Sol", "Sol+", "Single Stone", "3 stone", "Cluster", "Composite", "Multistone", "Quad", "Fancy"], "sub2": ["Classic", "Vintage", "Single Halo", "Double Halo", "Semimount", "Baguette", "Hidden Halo", "fancy shape diamond", "fancy", "Texture", "TM", "Colour Diamond", "Colour Stone", "Color Stone"]},
        "Fashion Rings": {"sub1": ["Multistone", "Cluster", "Composite", "Fancy Shape of Diamond", "Heart"], "sub2": ["Classic", "Vintage", "Baguette", "Fancy shape diamond", "TM", "Colour Diamond", "Color Stone"]},
        "Promise Ring": {"sub1": ["Cluster", "Single stone", "3 stone"], "sub2": ["Classic", "Vintage", "Single Halo", "Double Halo", "Baguette", "TM", "Colour Diamond", "Colour Stone"]},
        "Engagement Ring": {"sub1": ["Sol", "Sol+", "Cluster", "Composite", "Multistone", "3 stone", "Quad", "Fancy Shape of Diamond"], "sub2": ["Classic", "Vintage", "Single Halo", "Double Halo", "Semimount", "Baguette", "fancy shape diamond", "TM", "Colour Diamond", "Colour Stone"]},
        "Enhancer": {"sub1": [], "sub2": ["Vintage", "Color Stone", "Colour Diamond", "Baguette", "TM", "Fancy Shape of Diamond"]},
        "Stand Alone": {"sub1": ["RHR/ Cocktail", "Cross", "couple Band", "Mens"], "sub2": ["Fancy Shape of Diamond", "Chevron", "cross over / over under / twist", "Multistone", "bold gold", "rope / texture", "cross", "heart", "infinity", "alphabet", "zodiac", "hamsa", "butterfly", "Baguette", "Color Diamond", "Color Stone", "Classic", "TM"]}
    },
    "Earring": {
        "Studs": {"sub1": ["Sol", "Sol+", "Cluster", "Composite", "Multistone", "Fashion"], "sub2": ["Classic", "Baguette", "Fancy Shape of Diamond", "Bold Gold", "texture", "TM", "Color diamond", "Color stone", "3 stone", "Single Halo", "Double Halo", "Micro pave", "Heart", "Cross", "Charms", "Geometric", "Flat Back"]},
        "Hoops": {"sub1": ["Basic", "Fashion", "J-Hoop", "Cluster", "Composite", "Multistone", "Two Row", "3 stone"], "sub2": ["Classic", "Bold gold", "Baguette", "Front Back / Inside out", "Color stone", "Color diamond", "TM", "Fancy Shape of Diamond", "Criss Cross", "Cross", "Heart", "Inside Out", "texture"]},
        "Huggies": {"sub1": ["Basic", "Fashion", "J-Huggie", "Cluster", "Composite", "Multistone", "3 stone"], "sub2": ["Classic", "Micro pave", "Bold gold", "Baguette", "Color diamond", "Color Stone", "TM", "Fancy Shape of Diamond", "Geometric", "texture", "Cross", "Heart"]},
        "Danglers": {"sub1": ["Basic", "Fashion", "Cluster", "Composite", "Multistone", "3 Stone"], "sub2": ["Classic", "Bold gold", "Baguette", "Color stone", "Color diamond", "TM", "Fancy Shape of Diamond", "Cross", "Heart", "Geometric", "Quads", "Texture"]},
        "Ear crawlers": {"sub1": ["Basic"], "sub2": ["Sol"]},
        "Ear Party": {"sub1": ["Fashion"], "sub2": ["Cuff"]},
        "Multi wearable": {"sub1": ["Cluster", "Composite", "Multistone", "Classic", "Jacket"], "sub2": ["Helix", "Bold Gold", "Baguette", "Color Stone", "Color Diamond", "Fancy Shape Diamond", "Classic"]}
    },
    "Bangle": {
        "Basic": {"sub1": ["Classic", "Cluster", "Composite", "Mutlistone", "Fancy Shape of Diamond"], "sub2": ["Classic", "TM", "Single Halo", "Color Diamond", "Color Stone"]},
        "Fashion": {"sub1": ["Classic", "Cluster", "Composite", "Fancy shape diamond", "Heart", "Infinity", "Cross"], "sub2": ["Pave", "Cuff", "TM", "Bold Gold", "Classic", "Flexible", "Colour Diamond", "Colour Stone"]}
    },
    "Bracelet": {
        "Tennis Bracelet": {"sub1": ["Single Line", "Cluster", "Composite", "Multistone"], "sub2": ["Classic", "Single halo", "Double Halo", "Bold Gold", "Fancy Shape of Diamond", "TM", "Color diamond", "Color stone"]},
        "Fashion Bracelet": {"sub1": ["Classic", "Cluster", "Composite", "Multistone", "Heart", "Infinity"], "sub2": ["Classic", "TM", "Color Stone", "Colour Diamond", "Fancy Shape of Diamond"]},
        "Bolo Bracelets": {"sub1": ["Classic", "Cluster", "Composite", "Multistone", "Bar", "Heart", "Infinity"], "sub2": ["Classic", "Bold Gold", "Geometric", "Stackable", "Color Diamond", "Color Stone", "Baguette", "TM"]},
        "Chain Bracelet": {"sub1": ["Classic"], "sub2": ["Classic"]},
        "Thread Bracelet": {"sub1": ["Cluster"], "sub2": ["Charm"]},
        "Charm Bracelets": {"sub1": ["Multistone"], "sub2": ["Fancy"]},
        "Mens Bracelet": {"sub1": ["Heart", "Infinity", "Circle", "Bar"], "sub2": ["Baguette", "TM", "Color Diamond", "Color Stone", "Cross", "Lock and Key"]}
    },
    "Pendant": {
        "Basic": {"sub1": ["Sol", "Sol+", "Cluster", "Composite", "Multistone", "Basic"], "sub2": ["Classic", "Single Halo", "Double Halo", "Fancy Shape of Diamond", "Quad", "TM", "Colour Diamond", "Color Stone"]},
        "3Stone": {"sub1": ["Sol", "Sol+", "Cluster", "Composite", "Multistone", "Basic"], "sub2": ["Classic", "Single Halo", "Double Halo", "Fancy Shape of Diamond", "Quad", "TM", "Colour Diamond", "Color Stone"]},
        "Fashion1": {"sub1": ["Cluster", "Composite", "Multistone", "Circle", "Heart", "Cross"], "sub2": ["Classic", "Single Halo", "Fancy Shape Diamond", "Baguette", "Micro Pave", "Bold Gold", "Texture", "TM"]},
        "Fashion2": {"sub1": ["Infinity", "Keys", "Lock and Keys", "Lockets", "Medallion", "Zodiac / Alphabet"], "sub2": ["Classic", "Baguette", "Bold gold", "TM", "Color diamond", "Color stone", "Micro pave", "Texture"]}
    },
    "Necklace": {
        "Basic": {"sub1": ["Tennis", "Sol", "Sol+", "Cluster", "Composite", "Multistone", "Choker", "3-Stone/5-stone"], "sub2": ["Classic", "Single Halo", "Double Halo", "Composite", "Multistone", "Cluster", "Fancy Shape of Diamond", "TM"]},
        "Fashion": {"sub1": ["Y Necklace", "Bar necklace", "Diamond by yard", "Circle", "Heart", "Cross", "Cluster", "Composite", "Choker", "Paper Clip"], "sub2": ["Classic", "Layering", "Color Stone", "Colour Diamond", "Cluster", "Baguette", "Chevron", "Fancy Shape of Diamond", "TM", "Bold gold"]}
    }
}

METALS = ["White gold", "Yellow gold", "Rose gold", "Silver", "Platinum"]
DIAMONDS = ["LGD", "Mining", "Both"]
SHAPES = ["Round", "Pear", "Princess", "Baguette", "Oval", "Marquise"]
CUTS = ["Full - Brilliant", "Single", "Modified"]
COLOUR_STONES = ["Ruby", "Sapphire", "Emerald", "amethyst", "citrine", "quartz"]
MARKETS = ["AU", "UK", "EU", "FR", "USO", "USM", "ROW"]
CUSTOMERS = ["Signet", "MHJ", "Thom", "QVC", "TFG"]
DESIGNERS = ["Anurag", "Sandip", "Raju", "Snehal", "Imanur", "Asmita", "Farooq", "Jijai", "Khushbu", "Poonam", "Harshita", "Prachi", "Mangesh"]

def seed():
    db = SessionLocal()
    try:
        print("Seeding initial users and roles...")
        # Roles
        admin_role = db.query(models.Role).filter_by(role_name="Admin").first()
        if not admin_role:
            admin_role = models.Role(role_name="Admin")
            db.add(admin_role)
        des_role = db.query(models.Role).filter_by(role_name="Designer").first()
        if not des_role:
            des_role = models.Role(role_name="Designer")
            db.add(des_role)
        db.commit()

        # Seed designers as login users
        hashed_pwd = pwd_context.hash("diwali")
        for name in ["anurag", "sandip","ayushi"]:
            if not db.query(models.User).filter_by(username=name).first():
                db.add(models.User(username=name, email=f"{name}@company.com", hashed_password=hashed_pwd, role_id=des_role.id))

        print("Seeding lookup tables...")
        for m in METALS:
            if not db.query(models.MetalType).filter_by(name=m).first():
                db.add(models.MetalType(name=m))

        for d in DIAMONDS:
            if not db.query(models.DiamondType).filter_by(name=d).first():
                db.add(models.DiamondType(name=d))

        for s in SHAPES:
            if not db.query(models.Shape).filter_by(name=s).first():
                db.add(models.Shape(name=s))

        for c in CUTS:
            if not db.query(models.Cut).filter_by(name=c).first():
                db.add(models.Cut(name=c))

        for cs in COLOUR_STONES:
            if not db.query(models.ColourStone).filter_by(name=cs).first():
                db.add(models.ColourStone(name=cs))

        for mkt in MARKETS:
            if not db.query(models.Market).filter_by(name=mkt).first():
                db.add(models.Market(name=mkt))
        
        # Seed Customers
        for cust in CUSTOMERS:
            if not db.query(models.Customer).filter_by(name=cust).first():
                db.add(models.Customer(name=cust))

        for des in DESIGNERS:
            if not db.query(models.Designer).filter_by(name=des).first():
                db.add(models.Designer(name=des))

        print("Seeding cascade category hierarchy...")
        for main_cat_name, subcategories in CASCADE_DATA.items():
            mc = db.query(models.MainCategory).filter_by(name=main_cat_name).first()
            if not mc:
                mc = models.MainCategory(name=main_cat_name)
                db.add(mc)
                db.flush()

            for cat_name, sub_info in subcategories.items():
                cat = db.query(models.Category).filter_by(name=cat_name, main_category_id=mc.id).first()
                if not cat:
                    cat = models.Category(name=cat_name, main_category_id=mc.id)
                    db.add(cat)
                    db.flush()

                for s1 in sub_info.get("sub1", []):
                    if not db.query(models.Subcategory1).filter_by(name=s1, category_id=cat.id).first():
                        db.add(models.Subcategory1(name=s1, category_id=cat.id))

                for s2 in sub_info.get("sub2", []):
                    if not db.query(models.Subcategory2).filter_by(name=s2, category_id=cat.id).first():
                        db.add(models.Subcategory2(name=s2, category_id=cat.id))

        db.commit()
        print("✓ Database populated with master dropdown options.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()