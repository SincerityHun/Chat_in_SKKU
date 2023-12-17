$(document).ready(function () {
    // ADDING FRIEND
    var modal = document.getElementById("addFriendModal");
    var btn = document.getElementById("addFriendButton");
    var span = document.getElementsByClassName("sidebar_modal_modal-content_close")[0];
    var friends = $('#hiddenFriends').data('friends');
    var userId = $('#userId').data('user-id');

    btn.onclick = function() {
        modal.style.display = "flex";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
   

    // Handle add friend action
    document.querySelector(".sidebar_modal_modal-content_submit").onclick = function() {
        const senderUserId = userId;
        const receiverUserId = $('.sidebar_modal_modal-content_friend-name').val();
        console.log(senderUserId,receiverUserId)

        // Send a POST request to the add_friend endpoint
        $.ajax({
            url: '/add_friend',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                sender_userId: senderUserId,
                receiver_userId: receiverUserId
            }),
            success: function(response) {
                alert('Friend added successfully');
                // Close the modal and clear the input
                $('#addFriendModal').hide();
                $('.sidebar_modal_modal-content_friend-name').val('');
                modal.style.display = "none";
            },
            error: function(response) {
                alert('Failed to add friend: ' + response.responseJSON.detail);
            }
        });
    } 
    function updateFriendList(friends) {
        const friendListContainer = document.querySelector('.main_friend-profile');
        friendListContainer.innerHTML = ''; // Clear existing list
        console.log(friends);
        friends.forEach(friend => {
            // Create the friend div element
            const friendDiv = document.createElement('div');
            friendDiv.className = 'profile-user';
            // Add SVG and name div
            friendDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="profile-user_user-image">
                    <path
                        d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                <div class="profile-user_user-name">${friend}</div>
            `;
            //START SINGLE CHAT
            friendDiv.addEventListener('click', function() {
                const friendUserId = friend;
                const currentUserId = userId;

                // Send a request to the backend
                fetch('/get_or_create_single_chatroom', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ user1_id: currentUserId, user2_id: friendUserId })
                })
                .then(response => response.json())
                .then(data => {
                    window.location.href = '/chatroom?roomId='+ data.chatroomId+"&userId="+currentUserId;
                })
                .catch(error => console.error('Error:', error));
            });
            // Append the new div to the friend list container
            friendListContainer.appendChild(friendDiv);
        });
    }
    //Init List
    updateFriendList(friends);
    // WEB SOCKET FOR FRIEND LIST
    const socket = new WebSocket("ws://localhost:8000/ws");

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === "friend_added" & data.userId === userId) {
            console.log(data.message);
            updateFriendList(data.friends);
        }
    };
    //event handler of #friend-list
    //event handler of #chat-list.html

    $("#friend-list").click(function (e) {
        e.preventDefault(); // Prevent form submission
        window.location.href = "/friend_list?userId=" + userId;
    });
    $("#chat-list").click(function (e) {
        e.preventDefault();
        window.location.href = "/chat-list?userId=" + userId;
    });
});

