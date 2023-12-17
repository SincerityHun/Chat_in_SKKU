document.addEventListener('DOMContentLoaded', (event) => {
    //1. GROUP CHATTING MODAL
    var modal = document.getElementById("addChatModal");
    var btn = document.getElementById("addChatButton");
    var span = document.getElementsByClassName("sidebar_modal_modal-content_close")[0];
    var chats = $("#hiddenChats").data("chatrooms");
    var userId = $("#hiddenUserId").data("user-id");
    console.log(chats, userId)
    btn.onclick = function() {
        modal.style.display = "flex";
        // Fetch and display the friend list when the modal opens
        fetch(`/just_friend_list?userId=${userId}`)
            .then(response => response.json())
            .then(friends => {
                console.log(friends);
                const friendListDiv = document.querySelector('.friend-list');
                friendListDiv.innerHTML = ''; // Clear existing list
                friends.forEach(friend => {
                    const friendItem = document.createElement('div');
                    friendItem.className = 'friend-item';
                    friendItem.textContent = friend;
                    friendItem.onclick = function() {
                        this.classList.toggle('selected');
                    };
                    friendListDiv.appendChild(friendItem);
                });
            });
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    //2. Handle add chat action
    // Function to create group chat
    document.querySelector("#createGroupChat").onclick = function () {
        const selectedFriends = document.querySelectorAll('.friend-item.selected');
        const selectedFriendIds = Array.from(selectedFriends).map(friend => friend.outerText);
        selectedFriendIds.push(userId);
        const chatRoomName = document.querySelector('#roomName').value || "Group Chat"; // Default name if input is empty

        console.log(selectedFriends,selectedFriendIds, chatRoomName)
        fetch('/get_or_create_group_chatroom', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ members: selectedFriendIds, roomName: chatRoomName })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Group chat created:', data);
            window.location.href = "/chatroom?roomId=" + data.roomId + "&userId=" + userId;
            modal.style.display = "none";
            // Optionally, redirect to the new chat room or update the chat room list
        })
        .catch(error => console.error('Error:', error));
    };

    // Function to toggle friend selection
    document.querySelectorAll('.friend-item').forEach(friendItem => {
        friendItem.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    //3. Chatting Room Init
    // Function to update the chat room list in the UI
    function updateChatroomList(chatrooms) {
        const chatroomListContainer = document.querySelector('.main_chat-rooms');
        chatroomListContainer.innerHTML = ''; // Clear existing chat rooms

        chatrooms.forEach(chatroom => {
            const chatroomItem = document.createElement('div');
            chatroomItem.className = 'main_chat-rooms_item';
            chatroomItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="main_chat-rooms_item-image">
                    <path fill-rule="evenodd"
                        d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 001.28.53l4.184-4.183a.39.39 0 01.266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0012 2.25zM8.25 8.625a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zm2.625 1.125a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                        clip-rule="evenodd" />
                </svg>
                <div class="content">
                    <div class="main_chat-rooms_name">${chatroom.roomName}</div>
                    <p class="main_chat-rooms_message">${chatroom.latestMessage}</p>
                </div>
            `;
            chatroomItem.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = "/chatroom?roomId=" + chatroom.roomId + "&userId=" + userId;
            })
            chatroomListContainer.appendChild(chatroomItem);
        });
    }
    updateChatroomList(chats)
    //4. Chatting Room Update - web socket
    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onmessage = function (event) {
        const data = JSON.parse(event.data)
        if (data.type !== "friend_added") {
            window.location.href = "/chat-list?userId=" + userId;
        }
    }
    //5. event handler
    $("#friend-list").click(function (e) {
        e.preventDefault(); // Prevent form submission
        window.location.href = "/friend_list?userId=" + userId;
    });
    $("#chat-list").click(function (e) {
        e.preventDefault();
        window.location.href = "/chat-list?userId=" + userId;
    });
});
