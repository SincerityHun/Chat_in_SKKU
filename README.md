# Chat in SKKU
SKKU Talk


# How to run in Local Environment
1. ``` cd Chat_in_SKKU ```
2. ```pip install -r requirements.txt```
3. ```python main.py```
4. Connect to http://127.0.0.1:8000

# Code Architecture
```
Chat_in_SKKU
├─ README.md
├─ __pycache__
│  ├─ crud.cpython-310.pyc
│  ├─ database.cpython-310.pyc
│  ├─ models.cpython-310.pyc
│  └─ schema.cpython-310.pyc
├─ crud.py
├─ database.py
├─ main.py
├─ models.py
├─ requirements.txt
├─ schema.py
├─ sql_app.db
├─ static
│  ├─ chat-list_function.js
│  ├─ chat-list_style.css
│  ├─ chat_function.js
│  ├─ chat_style.css
│  ├─ friend_function.js
│  ├─ friend_style.css
│  ├─ image
│  │  └─ SKKU_TALK.png
│  ├─ login_function.js
│  └─ login_style.css
└─ templates
   ├─ chat-list.html
   ├─ chat.html
   ├─ friend.html
   └─ login.html

```