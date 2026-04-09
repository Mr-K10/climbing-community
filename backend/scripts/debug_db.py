import os
from dotenv import load_dotenv

load_dotenv(override=True)
db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: '{db_url}'")
if db_url:
    from sqlalchemy.engine import make_url
    try:
        url = make_url(db_url)
        print(f"Parsed URL: {url}")
    except Exception as e:
        print(f"Error parsing URL: {e}")
