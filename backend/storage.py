import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

def sanitize_filename(filename: str) -> str:
    # Remove special characters that Supabase doesn't allow
    filename = re.sub(r"['\"\(\)\[\]\{\}\#\%\&\+\,\=\@\!\$\^\*\<\>\?\|\\]", "", filename)
    # Replace spaces with underscores
    filename = filename.replace(" ", "_")
    # Remove any double underscores
    filename = re.sub(r"_+", "_", filename)
    return filename

def upload_file(file_bytes: bytes, filename: str, folder: str) -> str:
    supabase = get_supabase()
    clean_filename = sanitize_filename(filename)
    path = f"{folder}/{clean_filename}"
    supabase.storage.from_("iris-files").upload(
        path,
        file_bytes,
        {"content-type": "application/pdf", "x-upsert": "true"}
    )
    result = supabase.storage.from_("iris-files").get_public_url(path)
    return result

def download_file(file_url: str) -> bytes:
    import httpx
    response = httpx.get(file_url)
    return response.content

def download_file(file_url: str) -> bytes:
    import httpx
    response = httpx.get(file_url)
    return response.content