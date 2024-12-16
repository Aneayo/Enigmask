'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');

let stompClient = null;
let username = null;
let password = null;
let selectedUserId = null;

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

function connect(event) {
    username = document.querySelector('#username').value.trim();
    password = document.querySelector('#password').value.trim();

    if (username && password) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
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

    if (connectedUserElement) {
        connectedUserElement.textContent = username;
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
    const message = document.createElement('p');
    message.textContent = content;
    messageContainer.appendChild(message);
    chatArea.appendChild(messageContainer);
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

    try {
        const message = JSON.parse(payload.body);
        const decryptedContent = EncryptionUtil.decrypt(
            message.content,
            message.senderId
        );
        if (selectedUserId && selectedUserId === message.senderId) {
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

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();
