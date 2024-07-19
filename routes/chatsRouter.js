const express = require('express')
const router = express.Router()
const chatController = require("../controllers/chatController")

router.route('/messages/:receiverId/:senderId').get(chatController.getMessages)
router.route('/messages/:senderId').get(chatController.getCommunicatedUsers)
module.exports = router