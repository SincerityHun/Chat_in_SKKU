"use strict";
// 유저가 보낸 메세지
function make_send(object,text,time) {
    let finalTime = make_time(time);
    let data = `
    <div class="chat">
            <div class="time">${finalTime}</div>
            <div class="chat-text">${text}</div>
    </div>`;
    object.append(data);
};

// 유저가 받은 메세지
function make_receive(object,userId,text,time) {
    let finalTime = make_time(time);
    let data = `
    <div class="id">${userId}</div>
    <div class="chat receiver">
        <div class="time">${finalTime}</div>
        <div class="chat-text receiver">${text}</div>
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
function displayChatHistory(chatHistory) {
    let chatArea = $('.chat-area');
    chatHistory.forEach(chat => {
        if (chat.userId === $(".typing-login").val()) {
            make_send(chatArea, chat.text, chat.time);
        } else {
            make_receive(chatArea, chat.userId, chat.text, chat.time);
        }
    });
    $('.chat-area').scrollTop($('.chat-area')[0].scrollHeight);
}
$(document).ready(function () {
    var ws;
     function setupWebSocket() {
        ws = new WebSocket("ws://localhost:8000/ws");

        ws.onmessage = function(event) {
            console.log("WEB SOCKET");
            let data = JSON.parse(event.data); 
            let chatArea = $('.chat-area');
            let current_userId = $(".typing-login").val();
            if (data.userId == current_userId) {
                make_send(chatArea, data.text, data.time);
            }
            else {
                make_receive(chatArea, data.userId, data.text, data.time);
            }
            $('.chat-area').scrollTop($('.chat-area')[0].scrollHeight);
        };
    }

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
        // Data send
        let userId = $(".typing-login").val();
        let messageData = { userId: userId, text: text };
        ws.send(JSON.stringify(messageData));
        $(this).val("");
        }
    });
    // #user-enter button click event
    $("#user-enter").click(function (e) {
        e.preventDefault();
        let userId = $(".typing-login").val();
        console.log(userId);
        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ userId: userId}),
            success: function(response) {
                // Handle response here
                console.log('Login response:', response);
                setupWebSocket();
                displayChatHistory(response);
            },
            error: function(error) {
                // Handle error here
                console.error('Login error:', error.JSON);
            }
        });
    });
    // #user-send click event
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
        let userId = $(".typing-login").val();
        let messageData = { userId: userId, text: text };
        console.log("Sending message:", messageData); // 전송할 메시지 데이터 확인
        ws.send(JSON.stringify(messageData));
        textarea.val("");
        
    });
});
