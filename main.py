from fastapi import FastAPI, WebSocket, Request, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.logger import logger
from models import Base
from database import engine, SessionLocal
from schema import (
    UserCreate,
    UserLogin,
    FriendRequest,
    TextChatRequest,
    ImageChatRequest,
    VideoChatRequest,
)
from typing import List
from sqlalchemy.orm import Session
from crud import (
    create_user,
    verify_user,
    get_friends_list,
    add_friend,
    user_to_dict,
    get_or_create_single_chatroom,
    get_chat,
    get_roomName,
    chat,
    get_rooms_list,
    get_or_create_group_chatroom,
)
from fastapi.staticfiles import StaticFiles
import json
import os
import aiofiles


# 모델이랑 기본 베이스 바인딩
Base.metadata.create_all(bind=engine)
# FAST API
app = FastAPI()

# TEMPLATES
templates = Jinja2Templates(directory="templates")
# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/images", StaticFiles(directory="images"), name="images")
app.mount("/videos", StaticFiles(directory="videos"), name="videos ")


# 웹소켓 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_conections = []  # 웹 소켓 연결 목록

    # 웹소켓 객체 받아 연결 받고 연결 목록에 추가
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_conections.append(websocket)

    # 주어진 웹소켓 연결 목록 제거
    async def disconnect(self, websocket: WebSocket):
        self.active_conections.remove(websocket)

    # 모든 활성 연결에 Broadcast
    async def broadcast(self, message: str):
        for connection in self.active_conections:
            await connection.send_text(message)  # web socket send_text


manager = ConnectionManager()


# 세션 생성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db  # DB 세션을 제공하면서 함수의 실행을 일시중지...

    finally:
        db.close()


# /ws경로로 들어온 요청에 웹소켓 연결
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    # 1. 웹 연결
    await manager.connect(websocket)
    try:
        while True:
            # 웹소켓으로부터 데이터 받기
            data = (
                await websocket.receive_text()
            )  # {userId:str, roomId:int, text:str or image or video}
            # 받은 데이터를 데이터모델 객체화
            chat_req_data = json.loads(data)
            # Determine message type and parse to appropriate model
            if "text" in chat_req_data:
                chat_req = TextChatRequest(**chat_req_data)
            elif "image" in chat_req_data:
                chat_req = ImageChatRequest(**chat_req_data)
            elif "video" in chat_req_data:
                chat_req = VideoChatRequest(**chat_req_data)
            else:
                # Handle unknown message type
                continue
            # 데이터모델 객체를 데이터베이스에 저장
            # Store chat message in database
            chat_response = json.dumps(chat(db, chat_req))
            # 저장된 채팅 데이터를 클라이언트에게 broadcast
            await manager.broadcast(chat_response)
    except Exception as e:
        print(f"WEBSOCKET ERROR: {e}")
    finally:
        # 연결 끝나면 연결 끊기
        await manager.disconnect(websocket)


# client로 접근하면 request를 넣어 index.html 반환
@app.get("/")
async def client(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if create_user(db, user):
        return {"message": f"Register ID({user.userId}) Successfully"}


@app.post("/login")
def login(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    result = verify_user(db, user)
    if result:
        # Return a JSON response indicating success
        return JSONResponse(
            status_code=200, content={"status": "success", "userId": result.userId}
        )


@app.get("/friend_list")
async def get_friend_list(request: Request, userId: str, db: Session = Depends(get_db)):
    # Retrieve the user's friend list from the database
    # For simplicity, this example does not include the actual retrieval logic
    # Pass the necessary data to the template
    print(get_friends_list(db, userId))
    return templates.TemplateResponse(
        "friend.html",
        {
            "request": request,
            "userId": userId,
            "friends": json.dumps(get_friends_list(db, userId)),
        },
    )


@app.get("/just_friend_list")
async def api_get_friends_list(
    request: Request, userId: str, db: Session = Depends(get_db)
):
    friend_list = get_friends_list(db, userId)
    return friend_list


@app.post("/add_friend")
async def add_friend_endpoint(
    friend_request: FriendRequest, db: Session = Depends(get_db)
):
    result = add_friend(
        db, friend_request.sender_userId, friend_request.receiver_userId
    )
    if result:
        # Fetch the updated friend lists for both users
        sender_friends = get_friends_list(db, friend_request.sender_userId)
        receiver_friends = get_friends_list(db, friend_request.receiver_userId)

        # Prepare messages for both users
        sender_message = {
            "type": "friend_added",
            "userId": friend_request.sender_userId,
            "friends": sender_friends,
        }
        receiver_message = {
            "type": "friend_added",
            "userId": friend_request.receiver_userId,
            "friends": receiver_friends,
        }

        # Broadcast messages to all connected clients
        await manager.broadcast(json.dumps(sender_message))
        await manager.broadcast(json.dumps(receiver_message))

        return JSONResponse(status_code=200, content={"status": "success"})


@app.post("/get_or_create_single_chatroom")
async def get_or_create_chatroom_endpoint(
    request: Request, db: Session = Depends(get_db)
):
    data = await request.json()
    chatroom = get_or_create_single_chatroom(db, data["user1_id"], data["user2_id"])
    print(chatroom)
    return {"chatroomId": chatroom.roomId}


@app.post("/get_or_create_group_chatroom")
async def get_or_create_multiple_chatroom(
    request: Request, db: Session = Depends(get_db)
):
    data = await request.json()
    print("data:", data)
    chatroom = get_or_create_group_chatroom(db, data["members"], data["roomName"])
    print(chatroom)
    return {"roomId": chatroom.roomId}


@app.get("/chatroom")
async def get_chat_room(
    request: Request, roomId: int, userId: str, db: Session = Depends(get_db)
):
    roomName = get_roomName(db, roomId, userId)
    result = get_chat(db, roomId)
    print(result)
    # roomId의 채팅내역 반환
    return templates.TemplateResponse(
        "chat.html",
        {
            "request": request,
            "userId": userId,
            "roomId": roomId,
            "roomName": roomName,
            "chats": result,
        },
    )


@app.get("/chat-list")
async def get_chat_list(request: Request, userId: str, db: Session = Depends(get_db)):
    # userId 가 속한 room list을 반환.
    # 이떄
    result = get_rooms_list(db, userId)
    print(result)
    return templates.TemplateResponse(
        "chat-list.html",
        {"request": request, "userId": userId, "chatrooms": json.dumps(result)},
    )


# Upload Image and Video
async def save_file(file: UploadFile, file_path: str):
    async with aiofiles.open(file_path, "wb") as out_files:
        while content := await file.read(1024):
            await out_files.write(content)


@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...)):
    file_name = f"{file.filename}"
    file_location = f"images/{file_name}"

    await save_file(file, file_location)

    return {"url": file_location}


@app.post("/upload_video")
async def upload_video(file: UploadFile = File(...)):
    file_name = f"{file.filename}"
    file_location = f"videos/{file_name}"

    await save_file(file, file_location)

    return {"url": file_location}


def run():
    import uvicorn

    uvicorn.run(app)


if __name__ == "__main__":
    run()
