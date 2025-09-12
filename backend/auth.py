import hmac
import hashlib

SECRET_KEY = "supersecretkey"  # must match frontend

def verify_signature(message: str, signature: str) -> bool:
    computed_sig = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(computed_sig, signature)
