document.addEventListener('DOMContentLoaded', (event) => {
    // Get the modal
    var modal = document.getElementById("addFriendModal");

    // Get the button that opens the modal
    var btn = document.getElementById("addFriendButton");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("sidebar_modal_modal-content_close")[0];

    // When the user clicks the button, open the modal 
    btn.onclick = function() {
        modal.style.display = "flex";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle add friend action
    // Note: Ensure you have the appropriate IDs set for these elements
    document.querySelector(".sidebar_modal_modal-content_submit").onclick = function() {
        var friendName = document.querySelector(".sidebar_modal_modal-content_friend-name").value;
        // TODO: Add code to handle the friend addition
        console.log("Adding friend:", friendName);
        modal.style.display = "none";
    }
});
