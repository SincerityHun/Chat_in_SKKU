# Making DB Custom
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.orm import relationship


class ChatUser(Base):
    __tablename__ = "chatuser"
    index = Column(Integer, primary_key=True)
    userId = Column(String, unique=True)  # User Id
    chat_data = relationship("ChatData", backref="chatuser")


class ChatData(Base):
    __tablename__ = "chatdata"
    index = Column(Integer, primary_key=True)
    userId = Column(String, ForeignKey("chatuser.userId"))  # User ID
    time = Column(DateTime(timezone=True), default=func.now())  # Time with timezone
    text = Column(String)  # Text Data
