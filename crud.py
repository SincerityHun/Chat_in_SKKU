from sqlalchemy.orm import Session
from models import ChatUser, ChatData
from schema import ChatRequestCreate, ChatRequest
import pytz
from datetime import datetime


def get_chatlist(db: Session):
    chat_data = db.query(ChatData).all()
    return [chat_record_to_dict(chat) for chat in chat_data]


def chat_record_to_dict(chat_record):
    return {
        "index": chat_record.index,
        "userId": chat_record.userId,
        "time": chat_record.time,
        "text": chat_record.text,
    }


def login(db: Session, user_id: str):
    user = db.query(ChatUser).filter(ChatUser.userId == user_id).first()
    if not user:
        user = ChatUser(userId=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return get_chatlist(db)


def chat(db: Session, chat_req: ChatRequestCreate):
    try:
        # 서울 시간대로 현재 시간 설정
        seoul_tz = pytz.timezone("Asia/Seoul")
        current_time = datetime.now(seoul_tz)
        # 채팅 개수 계산 (데이터베이스에 저장된 채팅 메시지의 수)
        chat_count = db.query(ChatData).count()
        temp = {
            "userId": chat_req.userId,
            "text": chat_req.text,
            "time": current_time,
            "index": chat_count,
        }
        # 채팅 데이터 저장
        chat_data = ChatData(**temp)
        print(chat_data.text)
        db.add(chat_data)
        db.commit()
        db.refresh(chat_data)
        # 저장된 데이터를 ChatRequest 형태로 반환
        temp["time"] = temp["time"].isoformat()
        return temp

    except Exception as e:
        print(e)

