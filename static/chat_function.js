"use strict";
// 유저가 보낸 메세지
// Function to open the modal
function openModal(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = "block";
}
function make_send(object, messageData) {
    let finalTime = make_time(messageData.time);
    let content;

    switch (messageData.messageType) {
        case "text":
            content = `<div class="chat-text">${messageData.text}</div>`;
            break;
        case "image":
            content = `<img class="chat-text chat-media" src="${messageData.image}" alt="Image" onclick="openModal(this.src)">`;
            break;
        case "video":
            content = `<video class="chat-text chat-media" controls src="${messageData.video}""></video>`;
            break;
        default:
            content = `<div class="chat-text">Unsupported message type</div>`;
    }

    let data = `
        <div class="chat">
            <div class="time">${finalTime}</div>
            ${content}
        </div>`;
    object.append(data);
};
// 유저가 받은 메세지
function make_receive(object,messageData) {
    let finalTime = make_time(messageData.time);
    let content;

    switch (messageData.messageType) {
        case "text":
            content = `<div class="chat-text receiver">${messageData.text}</div>`;
            break;
        case "image":
            content = `<img class="chat-text chat-media receiver" src="${messageData.image}" alt="Image" onclick="openModal(this.src)">`;
            break;
        case "video":
            content = `<video class="chat-text chat-media receiver" controls src="${messageData.video}" "></video>`;
            break;
        default:
            content = `<div class="chat-text receiver">Unsupported message type</div>`;
    }

    let data = `
        <div class="id">${messageData.userId}</div>
        <div class="chat receiver">
            <div class="time">${finalTime}</div>
            ${content}
        </div>`;
    object.append(data);
};

// 시간 생성
function make_time(time) {
    console.log(time);
    let currentTime = new Date(time);
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero to minutes
    let ampm = hours >= 12 ? "오후" : "오전";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    let finalTime = `${ampm} ${hours}:${minutes}`;
    return finalTime;
};
function displayChatHistory(chatHistory,userId) {
    let chatArea = $('.chat-area');
    console.log(chatHistory);
    chatHistory.forEach(chat => {
        switch (chat.messageType) {
            case "text":
                if (chat.userId === userId) {
                    make_send(chatArea, chat);
                } else {
                    make_receive(chatArea, chat);
                }
                break;
            case "image":
                // Assuming make_send_image and make_receive_image are similar to make_send and make_receive but for images
                if (chat.userId === userId) {
                    make_send(chatArea, chat);
                } else {
                    make_receive(chatArea, chat);
                }
                break;
            case "video":
                // Similarly, for video messages
                if (chat.userId === userId) {
                    make_send(chatArea, chat);
                } else {
                    make_receive(chatArea,chat);
                }
                break;
        }
    });
    $('.chat-area').scrollTop($('.chat-area')[0].scrollHeight);
}

$(document).ready(function () {
    var ws;
    var userId = $('#hiddenUserId').data('user-id'); 
    var roomName = $('.header_chatId').data('room-name');
    var roomId = $('#hiddenRoomId').data('room-id'); 
    var chats = $('#hiddenChatResult').data('chats'); 
    console.log(userId, roomName, roomId)
    //0. 기존 채팅 로그 다운로드
    displayChatHistory(chats, userId);
    //1. 실시간 채팅용 웹소켓 연결
    function setupWebSocket() {
        ws = new WebSocket("ws://localhost:8000/ws");
        ws.onopen = function() {
            console.log("WebSocket connection established");
        };
        ws.onmessage = function(event) {
            let data = JSON.parse(event.data);
            let chatArea = $('.chat-area');
            console.log(data);
            if (data.userId == userId && data.roomId == roomId) {
                make_send(chatArea, data);
            } else {
                make_receive(chatArea,data);
            }

            $('.chat-area').scrollTop($('.chat-area')[0].scrollHeight);
            };
            ws.onerror = function(error) {
                console.error("WebSocket error:", error);
            };
    }
    setupWebSocket(userId, roomId);
    //2. 실시간 채팅용 채팅 보내기
    $(".typing-user").on('keydown', function (e) {
        // Enter가 눌리고 Shift가 동시에 눌리지 않은 경우를 감지합니다.
        if (e.key === "Enter" && !e.shiftKey) {
            // 커서의 위치를 저장합니다.
            const cursorPos = this.selectionStart;
            // 커서의 위치가 텍스트 끝이 아니면 기본 이벤트(줄바꿈)를 방지합니다.
            if (cursorPos < this.value.length) {
                e.preventDefault(); // Default Enter action prevented
            }
        }
    });
    $(".typing-user").on('keyup', function (e) {
    console.log('Key pressed:', e.key); // To check which key was pressed.
        if (e.key === "Enter" && !e.shiftKey) {
        console.log("User enter  clicked"); // 버튼 클릭 확인
        e.preventDefault();
        let cursorPos = this.selectionStart;
        // Get the current text without trimming
        let text = $(this).val();
        console.log(text.length);
        if (cursorPos < text.length) {
                // 커서 위치 기준으로 텍스트를 두 부분으로 나눕니다.
                let beforeEnter = text.substr(0, cursorPos - 1);
                let afterEnter = text.substr(cursorPos);

                // Enter가 중간에 있었다면, 텍스트를 재구성합니다.
                text = beforeEnter + afterEnter;
        } else {
                // 문장의 끝에서 Enter가 눌렸다면, 줄바꿈을 <br> 태그로 변환합니다.
                // Remove only the last newline if it exists
                if (text.endsWith("\n")) { // Check if text ends with a newline character
                    text = text.substring(0, text.length - 1); // Remove the last character if it's a newline
                }
        }
        
        if(text.trim() === ""){
            // If there's no content, just return without sending a message
            $(this).val("");
            return;
        }
        // Convert newlines to <br> tags if there's a message followed by Enter
        text = text.replace(/\n/g, "<br>");
        text = text.replace(/\s/g, '\u00A0');
            
        // 벡엔드로 데이터 전송
        let messageData = { userId: userId, roomId:roomId,text: text };
        ws.send(JSON.stringify(messageData));
        $(this).val("");
        }
    });
    $("#user-send").click(function (e) {
        e.preventDefault();
        console.log("User send button clicked"); // 버튼 클릭 확인
        // 데이터 받기
        
        let textarea = $('.typing-user');  
        let text = textarea.val().replace(/\n/g, "<br>");
        if(text.trim() === ""){
            // If there's no content, just return without sending a message
            textarea.val("");
            return;
        }

        //Backend로 데이터 전송
        let messageData = { userId: userId, roomId:roomId,text: text };
        console.log("Sending message:", messageData); // 전송할 메시지 데이터 확인
        ws.send(JSON.stringify(messageData));
        textarea.val("");
        
    });

    //3. x누르면 나가게
    $(".header_close").click(function (e) {
        e.preventDefault();
        console.log("clicked");
        window.location.href = "/chat-list?userId=" + userId;
    });

    //4. 이미지 보내기
    // Function to upload a file
    async function uploadFile(file, url) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(url, {
            method: "POST",
            body: formData
        });
        return response.json();
    }

    // Function to send a chat message with the file URL
    function sendChatMessage(url, type) {
        const messageData = {
            userId: userId,
            roomId: roomId,
            messageType:"type",
            [type]: url
        };
        ws.send(JSON.stringify(messageData));
    }
    // Event listeners for file inputs
    document.getElementById('imageInput').addEventListener('change', async function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            const response = await uploadFile(file, '/upload_image');
            if (response.url) {
                sendChatMessage(response.url, 'image');
            }
        }
    });

    document.getElementById('videoInput').addEventListener('change', async function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            const response = await uploadFile(file, '/upload_video');
            if (response.url) {
                sendChatMessage(response.url, 'video');
            }
        }
    });

    $(".content_image").click(function (e) {
        e.preventDefault();
        $("#imageInput").click(); // Trigger file input
    })
    $(".content_video").click(function (e) {
        e.preventDefault();
        $("#videoInput").click(); // Trigger file input
    })
    $(".close").click(function() {
        document.getElementById('imageModal').style.display = "none";
    })
});
