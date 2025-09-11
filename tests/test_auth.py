from backend.auth import sign_message, verify_message

def test_hmac_auth():
    msg = "12.9716,77.5946,2025-09-11T10:00:00Z"
    sig = sign_message(msg)
    assert verify_message(msg, sig) == True
    assert verify_message(msg, "wrong_signature") == False
