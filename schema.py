from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RequestBase(BaseModel):
    userId: str
    text: str


# 받았을 떄
class ChatRequestCreate(RequestBase):
    pass


# 보낼 때
class ChatRequest(BaseModel):
    index: Optional[int]
    userId: str
    time: Optional[datetime]
    text: str

    class Config:
        orm_mode = True


class LoginRequest(BaseModel):
    userId: str
