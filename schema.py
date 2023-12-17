from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Pydantic models for request body
class UserCreate(BaseModel):
    userId: str
    userPassword: str


class UserLogin(BaseModel):
    userId: str
    userPassword: str


class FriendRequest(BaseModel):
    sender_userId: str
    receiver_userId: str


class ChatRequest(BaseModel):
    userId: str
    roomId: int


class TextChatRequest(ChatRequest):
    text: str


class ImageChatRequest(ChatRequest):
    image: str


class VideoChatRequest(ChatRequest):
    video: str
