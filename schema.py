from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import base64


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
    image: str  # Base64

    @validator("image")
    def validate_image(cls, v):
        try:
            # Decode to check if it's valid Base64, but store as a string
            base64.b64decode(v)
        except ValueError:
            raise ValueError("Invalid image format")
        return v


class VideoChatRequest(ChatRequest):
    video: str  # Base64

    @validator("video")
    def validate_video(cls, v):
        try:
            # Decode to check if it's valid Base64, but store as a string
            base64.b64decode(v)
        except ValueError:
            raise ValueError("Invalid video format")
        return v
