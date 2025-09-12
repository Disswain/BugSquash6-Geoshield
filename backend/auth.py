# backend/auth.py
import hmac
import hashlib

SECRET_KEY = b"MySecretKey123"  # for demo only

def generate_hmac(message: str) -> str:
    """Generate HMAC signature for a given message (string)."""
    return hmac.new(SECRET_KEY, message.encode(), hashlib.sha256).hexdigest()

def verify_hmac(message: str, signature: str) -> bool:
    """Verify if a given signature matches the message."""
    expected_sig = generate_hmac(message)
    return hmac.compare_digest(expected_sig, signature)
