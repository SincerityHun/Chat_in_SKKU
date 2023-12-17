from sqlalchemy import func
from sqlalchemy.orm import Session
from models import (
    ChatUser,
    ChatData,
    ChatRoom,
    friendship_association,
    chatroom_association,
)
from schema import UserCreate, UserLogin, ChatRequest
import pytz
from datetime import datetime
from fastapi import HTTPException, status
import json
from typing import Optional, List
import base64


# Function to register a new user
def create_user(db: Session, user: UserCreate):
    # 유저 있는지 탐색
    db_user = db.query(ChatUser).filter(ChatUser.userId == user.userId).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")
    # 유저가 없으면 유저 추가
    new_user = ChatUser(userId=user.userId, userPassword=user.userPassword)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# Function to verify user login
def verify_user(db: Session, user: UserLogin):
    # 유저 비번 확인
    db_user = (
        db.query(ChatUser)
        .filter(
            ChatUser.userId == user.userId, ChatUser.userPassword == user.userPassword
        )
        .first()
    )
    # 유저 비번 아니면 Exception
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    # 맞으면 해당 유저 반환
    return db_user


# Function to get a user's friend list
def get_friends_list(db: Session, user_id: str):
    user = db.query(ChatUser).filter(ChatUser.userId == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    friends_list = [friend.userId for friend in user.friends]
    return friends_list


def get_rooms_list(db: Session, user_id: str):
    # Retrieve user's chat rooms
    user = db.query(ChatUser).filter(ChatUser.userId == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    chat_rooms = user.rooms
    chat_list = []

    for room in chat_rooms:
        # Find the most recent message in each room
        latest_message = (
            db.query(ChatData)
            .filter(ChatData.roomId == room.roomId)
            .order_by(ChatData.time.desc())
            .first()
        )
        temp_msg = ""
        if latest_message is not None:
            if latest_message.text:
                temp_msg = latest_message.text
            else:
                temp_msg = "Media Data"
        # Format the room data
        room_data = {
            "roomId": room.roomId,
            "roomName": get_roomName(db, room.roomId, user_id),
            "latestMessage": temp_msg,
        }
        chat_list.append(room_data)
    return chat_list


# Function to add a friend
def add_friend(db: Session, sender_userId: str, receiver_userId: str):
    sender = db.query(ChatUser).filter(ChatUser.userId == sender_userId).first()
    receiver = db.query(ChatUser).filter(ChatUser.userId == receiver_userId).first()
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    if receiver in sender.friends:
        raise HTTPException(status_code=403, detail="User already friend")
    # Add each other as friends
    sender.friends.append(receiver)
    receiver.friends.append(sender)
    db.commit()
    return 1  # Friendship established


def user_to_dict(user: ChatUser):
    return {
        "userId": user.userId,
        # Add other necessary fields here
    }


def get_or_create_single_chatroom(db: Session, user1_id: str, user2_id: str):
    # Query to find a chat room with exactly two specified members
    chatroom = (
        db.query(ChatRoom)
        .join(chatroom_association, ChatRoom.roomId == chatroom_association.c.roomId)
        .filter(chatroom_association.c.userId.in_([user1_id, user2_id]))
        .group_by(ChatRoom.roomId)
        .having(func.count() == 2)
        .first()
    )

    if chatroom:
        return chatroom  # Existing chat room found

    # Create a new chat room if not found
    new_chatroom = ChatRoom(roomName="Private Chat")  # 2명 있다는 뜻
    db.add(new_chatroom)
    db.flush()  # Flush to get the roomId of newly created chat room

    # Add users to the association table
    for user_id in [user1_id, user2_id]:
        association = chatroom_association.insert().values(
            roomId=new_chatroom.roomId, userId=user_id
        )
        db.execute(association)

    db.commit()
    return new_chatroom


def get_or_create_group_chatroom(db: Session, members: List[str], roomName: str):
    # 1. Check if all users exist
    for member_id in members:
        if not db.query(ChatUser).filter(ChatUser.userId == member_id).first():
            raise HTTPException(status_code=404, detail="User not found")

    # 2. Check if a chat room exists with exactly these members and the same roomName
    chatroom = (
        db.query(ChatRoom)
        .join(chatroom_association, ChatRoom.roomId == chatroom_association.c.roomId)
        .filter(ChatRoom.roomName == roomName)
        .having(func.count() == len(members))
        .group_by(ChatRoom.roomId)
        .first()
    )

    if chatroom:
        # Return existing chat room
        return chatroom

    # 3. Create a new chat room if not found
    new_chatroom = ChatRoom(roomName=roomName)
    db.add(new_chatroom)
    db.flush()  # Get the roomId of the newly created chat room

    # Add members to the association table
    for user_id in members:
        association = chatroom_association.insert().values(
            roomId=new_chatroom.roomId, userId=user_id
        )
        db.execute(association)

    db.commit()
    return new_chatroom


# 채팅 기록 반환
def get_chat(db: Session, roomId: str):
    chat_messages = db.query(ChatData).filter(ChatData.roomId == roomId).all()
    formatted_messages = []
    for msg in chat_messages:
        message_info = {
            "userId": msg.userId,
            "time": msg.time.isoformat(),
            "messageType": msg.message_type,
        }
        if msg.message_type == "text":
            message_info["text"] = msg.text
        elif msg.message_type == "image":
            # 인코딩된 Base64 문자열로 변환
            message_info["image"] = (
                base64.b64encode(msg.image).decode() if msg.image else None
            )
        elif msg.message_type == "video":
            message_info["video"] = (
                base64.b64encode(msg.video).decode() if msg.video else None
            )

        formatted_messages.append(message_info)

    return json.dumps(formatted_messages)


def get_roomName(db: Session, roomId: str, userId: str):
    # Fetch the chat room using roomId
    chatroom = db.query(ChatRoom).filter(ChatRoom.roomId == roomId).first()
    if not chatroom:
        raise HTTPException(status_code=404, detail="Chat Room not found")

    # Check if the roomName is "Private Chat"
    if chatroom.roomName == "Private Chat":
        # Find the other participant in the chat room
        for member in chatroom.members:
            if member.userId != userId:
                return member.userId  # Return the other user's ID

    # If not "Private Chat", return the actual room name
    return chatroom.roomName


# 채팅 추가
def chat(db: Session, chat_req: ChatRequest):
    seoul_tz = pytz.timezone("Asia/Seoul")
    current_time = datetime.now(seoul_tz)
    temp = {
        "userId": chat_req.userId,
        "roomId": chat_req.roomId,
        "time": current_time,
        "text": chat_req.text if hasattr(chat_req, "text") else None,
        "image": base64.b64decode(chat_req.image)
        if hasattr(chat_req, "image")
        else None,  # 디코딩된 상태로 저장완료
        "video": base64.b64decode(chat_req.video)
        if hasattr(chat_req, "video")
        else None,  # 디코딩된 상태로 저장완료
    }
    chat_data = ChatData(**temp)
    print(temp)
    db.add(chat_data)
    db.commit()
    db.refresh(chat_data)
    temp["time"] = temp["time"].isoformat()
    temp["messageType"] = chat_data.message_type
    # # Base64 데이터가 있는 경우, JSON 직렬화 가능한 형태로 변환
    if temp["image"]:
        temp["image"] = chat_req.image
    if temp["video"]:
        temp["video"] = chat_req.video
    return temp
