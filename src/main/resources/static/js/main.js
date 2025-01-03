'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');
const registerForm = document.querySelector('#registerForm');
const registerLink = document.querySelector('#register-link');
const registerPage = document.querySelector('#register-page');

let stompClient = null;
let username = null;
let password = null;
let selectedUserId = null;

function isBase64(str) {
    try {
        return btoa(atob(str)) === str; // 檢查編碼後是否一致
    } catch (error) {
        return false;
    }
}

const EncryptionUtil = {
    // Basic encryption (not cryptographically secure, for demonstration)
    encrypt(content, key) {
        let result = '';
        for (let i = 0; i < content.length; i++) {
            result += String.fromCharCode(
                content.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);  // Base64 encode
    },

    // Basic decryption
    decrypt(encryptedContent, key) {
        const decoded = atob(encryptedContent);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(
                decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }
};

async function connect(event) {
    username = document.querySelector('#username').value.trim();
    password = document.querySelector('#password').value.trim();

    if (username && password) {
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function(frame) {
            // Subscribe to login response
            stompClient.subscribe('/user/topic/public', async function (payload) {
                const user = JSON.parse(payload.body);

                if (user.status === 'ONLINE') {
                    usernamePage.classList.add('hidden');
                    chatPage.classList.remove('hidden');

                    stompClient.subscribe(`/user/${username}/queue/messages`, onMessageReceived);

                    stompClient.send("/app/user.addUser",
                        {},
                        JSON.stringify({username: username, password: password, status: 'ONLINE'})
                    );
                    await onConnected();
                    findAndDisplayConnectedUsers().then();
                } else {
                    alert('Invalid username or password');
                    stompClient.disconnect();
                }
            });

            stompClient.send("/app/user.login",
                {},
                JSON.stringify({username: username, password: password})
            );
        }, onError);
    }
    event.preventDefault();
}

function onConnected() {
    stompClient.subscribe(`/user/${username}/queue/messages`, onMessageReceived);
    stompClient.subscribe(`/user/topic/public`, onMessageReceived);

    // register the connected user
    stompClient.send("/app/user.addUser",
        {},
        JSON.stringify({username: username, password: password, status: 'ONLINE'})
    );

    const connectedUserElement = document.querySelector('#connected-user-username');
    console.log(connectedUserElement)
    if (connectedUserElement) {
        connectedUserElement.textContent = username;
        // console.log(connectedUserElement);
    } else {
        console.error("Error: The element '#connected-user-username' does not exist in the DOM.");
    }

    findAndDisplayConnectedUsers().then();
}

async function findAndDisplayConnectedUsers() {
    const connectedUsersResponse = await fetch('/users');

    let connectedUsers;

    try {
        const responseData = await connectedUsersResponse.json();
        console.log("Connected users response:", responseData);

        // Handle the structure of the response
        if (Array.isArray(responseData)) {
            connectedUsers = responseData;
        } else if (responseData.users && Array.isArray(responseData.users)) {
            connectedUsers = responseData.users;
        } else if (responseData.username) {
            connectedUsers = [responseData];
        } else {
            connectedUsers = [];
        }

    } catch (error) {
        console.error("Error parsing /users response:", error);
        return;
    }

    // Display the connected users
    const filteredUsers = connectedUsers.filter(user => user.username !== username);
    const connectedUsersList = document.getElementById('connectedUsers');
    connectedUsersList.innerHTML = '';

    filteredUsers.forEach(user => {
        appendUserElement(user, connectedUsersList);
        if (filteredUsers.indexOf(user) < filteredUsers.length - 1) {
            const separator = document.createElement('li');
            separator.classList.add('separator');
            connectedUsersList.appendChild(separator);
        }
    });
}

function appendUserElement(user, connectedUsersList) {
    const listItem = document.createElement('li');
    listItem.classList.add('user-item');
    listItem.id = user.username;

    const userImage = document.createElement('img');
    userImage.src = '../image/user_icon.png';
    userImage.alt = user.username;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.username;

    const receivedMsgs = document.createElement('span');
    receivedMsgs.textContent = '0';
    receivedMsgs.classList.add('nbr-msg', 'hidden');

    listItem.appendChild(userImage);
    listItem.appendChild(usernameSpan);
    listItem.appendChild(receivedMsgs);

    listItem.addEventListener('click', userItemClick);

    connectedUsersList.appendChild(listItem);
}

function userItemClick(event) {
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    messageForm.classList.remove('hidden');

    const clickedUser = event.currentTarget;
    clickedUser.classList.add('active');

    selectedUserId = clickedUser.getAttribute('id');
    fetchAndDisplayUserChat().then();

    const nbrMsg = clickedUser.querySelector('.nbr-msg');
    nbrMsg.classList.add('hidden');
    nbrMsg.textContent = '0';
}

function displayMessage(senderId, content) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message');
    if (senderId === username) {
        messageContainer.classList.add('sender');
    } else {
        messageContainer.classList.add('receiver');
    }
    let decryptedContent = content;
    // Check if the content is Base64 encoded and decrypt it if necessary
    if (isBase64(content)) {
        decryptedContent = EncryptionUtil.decrypt(content, senderId);
        console.log("Decrypted content:", decryptedContent);
    } else {
        console.error("Invalid Base64 string:", content);
    }
    const message = document.createElement('p');
    message.textContent = content;
    message.textContent = decryptedContent;
    messageContainer.appendChild(message);
    chatArea.appendChild(messageContainer);
    // const message = document.createElement('p');
    // // EncryptionUtil.decrypt(content);
    // console.log(content);
    // message.textContent = content;
    // messageContainer.appendChild(message);
    // chatArea.appendChild(messageContainer);
}

async function fetchAndDisplayUserChat() {
    const userChatResponse = await fetch(`/queue/messages/${username}/${selectedUserId}`);
    const userChat = await userChatResponse.json();
    chatArea.innerHTML = '';

    userChat.forEach(chat => {
        displayMessage(chat.senderId, chat.content);
    });

    chatArea.scrollTop = chatArea.scrollHeight;
}

function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    const messageContent = messageInput.value.trim();
    if (messageContent && stompClient && selectedUserId) {
        const encryptedContent = EncryptionUtil.encrypt(
            messageContent,
            username
        );

        const chatMessage = {
            senderId: username,
            recipientId: selectedUserId,
            content: encryptedContent,
            timestamp: new Date()
        };

        stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));
        displayMessage(username, messageContent);
        messageInput.value = '';
    }
    chatArea.scrollTop = chatArea.scrollHeight;
    event.preventDefault();
}

async function onMessageReceived(payload) {
    await findAndDisplayConnectedUsers();
    console.log('Message received', payload);
    const message = JSON.parse(payload.body);

    try {
        const message = JSON.parse(payload.body);

        let decryptedContent = message.content
        console.log(decryptedContent)
        // Check before decryption
        if (isBase64(message.content)) {
            decryptedContent = EncryptionUtil.decrypt(message.content, message.senderId);
            console.log("Decrypted content:", decryptedContent);
        } else {
            console.error("Invalid Base64 string:", message.content);
        }
        if (selectedUserId && selectedUserId === message.senderId) {
            await fetchAndDisplayUserChat();
            displayMessage(message.senderId, decryptedContent);
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    } catch (error) {
        console.error('Decryption error:', error);
    }
}

function onLogout() {
    stompClient.send("/app/user.disconnectUser",
        {},
        JSON.stringify({username: username, password: password, status: 'OFFLINE'})
    );
    window.location.reload();
}

function jump_reg() {
    usernamePage.classList.add('hidden');
    registerPage.classList.remove('hidden');
}

function register(event) {
    const username = document.querySelector('#r_nickname').value.trim();
    const password = document.querySelector('#r_fullname').value.trim();
    const confirmPassword = document.querySelector('#r2_fullname').value.trim();

    if (password !== confirmPassword) {
        alert('密碼不一致，請重新輸入。');
        return;
    }

    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function() {
        console.log('STOMP 連接成功，發送用戶註冊請求...');

        // Explicitly set all fields, including status
        const userData = {
            username: username,
            password: password,
            status: 'OFFLINE'
        };

        stompClient.send("/app/user.addUser", {}, JSON.stringify(userData));

        alert('註冊成功，請登入。');
        registerPage.classList.add('hidden');
        usernamePage.classList.remove('hidden');
    }, function(error) {
        console.error('STOMP 連接失敗: ', error);
        alert('無法連接到伺服器，請稍後再試');
    });
    event.preventDefault();
}

usernameForm.addEventListener('submit', connect, true); // step 1
registerLink.addEventListener('click', jump_reg, true);
registerForm.addEventListener('submit', register, true);
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();

function startChatPolling() {
    setInterval(fetchAndDisplayUserChat, 20);
}

startChatPolling();
