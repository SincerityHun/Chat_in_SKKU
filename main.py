from fastapi import FastAPI, WebSocket, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.logger import logger
from models import Base
from database import engine, SessionLocal
from schema import ChatRequest, ChatRequestCreate, LoginRequest
from typing import List
from sqlalchemy.orm import Session
from crud import chat, login
from fastapi.staticfiles import StaticFiles
import json

# 모델이랑 기본 베이스 바인딩
Base.metadata.create_all(bind=engine)
# FAST API
app = FastAPI()

# TEMPLATES
templates = Jinja2Templates(directory="templates")
# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")


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
            data = await websocket.receive_text()
            # 받은 데이터를 데이터베이스에 저장
            chat_request = ChatRequestCreate(**json.loads(data))
            # 데이터베이스에 채팅 데이터 저장
            chat_response = json.dumps(chat(db, chat_request))
            # 저장된 채팅 데이터를 클라이언트에게 broadcast
            await manager.broadcast(chat_response)
    except Exception as e:
        pass
    finally:
        # 연결 끝나면 연결 끊기
        await manager.disconnect(websocket)


# client로 접근하면 request를 넣어 index.html 반환
@app.get("/")
async def client(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/login", response_model=List[ChatRequest])
def post_login(login_req: LoginRequest, db: Session = Depends(get_db)):
    result = login(db, login_req.userId)
    # 1. 위의 목록을 전송해준다.
    return result


def run():
    import uvicorn

    uvicorn.run(app)


if __name__ == "__main__":
    run()
