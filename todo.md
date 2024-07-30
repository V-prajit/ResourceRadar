Improve SSH connection retry logic in SSH_Client.js:

Implement cooldown period after failed attempts
Add state management for offline systems
Replace setInterval with recursive setTimeout
Set maximum retry time
Test thoroughly and update documentation