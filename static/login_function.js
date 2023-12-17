$(document).ready(function () {
    // Handle the Register button click
    $('.box_form_button_register').click(function (e) {
        e.preventDefault(); // Prevent form submission
        const userId = $('.box_form_userId').val();
        const userPassword = $('.box_form_password').val();

        // Send a POST request to the /register endpoint
        $.ajax({
            url: '/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: userId,
                userPassword: userPassword
            }),
            success: function (response) {
                alert(response.message); // Alert the success message
            },
            error: function (response) {
                alert('Registration failed: ' + response.responseJSON.detail);
            }
        });
    });

    // Handle the Login button click
    $('.box_form_button_login').click(function (e) {
        e.preventDefault(); // Prevent form submission
        const userId = $('.box_form_userId').val();
        const userPassword = $('.box_form_password').val();

        // Send a POST request to the /login endpoint
        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: userId,
                userPassword: userPassword
            }),
            success: function (response) {
                if (response.status === "success") {
                // Redirect to friend_list with userId
                window.location.href = '/friend_list?userId=' + response.userId;
                } else {
                    alert('Login failed');
                }
            },
            error: function (response) {
                alert('Login failed: ' + response.responseJSON.detail);
            }
        });
    });
});
