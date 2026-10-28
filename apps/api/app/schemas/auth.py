from typing import Optional, List
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    role_code: str
    role_name: str
    permissions: List[str]

class TokenPayload(BaseModel):
    sub: str  # user_id
    username: str
    role_code: str
    exp: Optional[int] = None
