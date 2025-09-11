import hmac
import hashlib

# Secret key (in real systems, securely shared)
SECRET_KEY = b"geoshield_secret_key"

def sign_message(message: str) -> str:
    """
    Signs a message (GPS data string) with HMAC-SHA256
    Returns hex signature
    """
    return hmac.new(SECRET_KEY, message.encode(), hashlib.sha256).hexdigest()

def verify_message(message: str, signature: str) -> bool:
    """
    Verifies if message matches the given signature
    """
    expected_sig = sign_message(message)
    return hmac.compare_digest(expected_sig, signature)
