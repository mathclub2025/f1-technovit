import os
from dotenv import load_dotenv
from fastapi import Header, HTTPException, WebSocket, WebSocketException, status, Query, Depends
try:
    import jwt
    JWTError = getattr(jwt, "PyJWTError", Exception)
except ImportError:
    from jose import JWTError, jwt
from models import TokenPayload

SECRET = os.getenv("SHARED_JWT_SECRET", "technovit_f1_shared_jwt_secret_key_2026")
ALGORITHM = "HS256"

def _decode(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except (JWTError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
def get_current_user(authorization: str = Header(...)) -> TokenPayload:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    token = authorization.split(" ")[1]
    
    try:
        return _decode(token)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or Expired Token")

def require_admin(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
    if user is None or user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role is required")
    return user

async def get_current_user_ws(websocket: WebSocket, token: str = Query(...)) -> TokenPayload:
    try:
        return _decode(token)
    except Exception:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)