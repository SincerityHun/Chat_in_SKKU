from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


# Association table for friendships
friendship_association = Table(
    "friendship_association",
    Base.metadata,
    Column("user_id", String, ForeignKey("chatuser.userId")),
    Column("friend_id", String, ForeignKey("chatuser.userId")),
)
# Association table for the many-to-many relationship between ChatUser and ChatRoom
chatroom_association = Table(
    "chatroom_association",
    Base.metadata,
    Column("userId", String, ForeignKey("chatuser.userId")),
    Column("roomId", Integer, ForeignKey("chatroom.roomId")),
)


class ChatUser(Base):
    __tablename__ = "chatuser"
    userId = Column(String, primary_key=True)  # User Id
    userPassword = Column(String)  # User Password
    # Relationships
    chat_data = relationship("ChatData", backref="chatuser")
    rooms = relationship(
        "ChatRoom", secondary=chatroom_association, back_populates="members"
    )
    friends = relationship(
        "ChatUser",
        secondary=friendship_association,
        primaryjoin=(friendship_association.c.user_id == userId),
        secondaryjoin=(friendship_association.c.friend_id == userId),
        backref="added_friends",
    )


class ChatRoom(Base):
    __tablename__ = "chatroom"
    roomId = Column(Integer, primary_key=True)
    roomName = Column(String)  # Name of the chat room
    members = relationship(
        "ChatUser", secondary=chatroom_association, back_populates="rooms"
    )
    messages = relationship("ChatData", backref="chatroom")


class ChatData(Base):
    __tablename__ = "chatdata"
    index = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(String, ForeignKey("chatuser.userId"))  # User ID
    roomId = Column(Integer, ForeignKey("chatroom.roomId"))  # Room ID
    time = Column(DateTime(timezone=True), default=func.now())  # Time with timezone
    text = Column(String, nullable=True)  # Text Data
    image = Column(LargeBinary, nullable=True)  # URL or path to image file
    video = Column(LargeBinary, nullable=True)  # URL or path to video file

    # Use a property or hybrid_property to determine the message type
    @property
    def message_type(self):
        if self.text:
            return "text"
        elif self.image:
            return "image"
        elif self.video:
            return "video"
        return "unknown"
