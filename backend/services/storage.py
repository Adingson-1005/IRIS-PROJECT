import os
import mimetypes
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

def upload_file(file_bytes: bytes, filename: str, folder: str) -> str:
    supabase = get_supabase()
    path = f"{folder}/{filename}"

    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = "application/octet-stream"

    supabase.storage.from_("iris-files").upload(
        path,
        file_bytes,
        {"content-type": content_type, "x-upsert": "true"}
    )
    result = supabase.storage.from_("iris-files").get_public_url(path)
    return result

def download_file(file_url: str) -> bytes:
    import httpx
    response = httpx.get(file_url)
    return response.content

def delete_file(file_url: str) -> bool:
    """Delete a file from Supabase Storage given its public URL.
    Best-effort: returns False and logs instead of raising, so a storage
    hiccup never blocks a database delete from completing."""
    if not file_url:
        return False
    try:
        marker = "/iris-files/"
        idx = file_url.find(marker)
        if idx == -1:
            return False
        path = file_url[idx + len(marker):]
        supabase = get_supabase()
        supabase.storage.from_("iris-files").remove([path])
        return True
    except Exception as e:
        print(f"Storage delete failed for {file_url}: {e}")
        return False