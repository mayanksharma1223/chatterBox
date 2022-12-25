import { AddIcon, ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';
import { Box, Button, FormControl, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Spinner, Text, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'
import { ChatState } from '../Context/ChatProvider'
import { getSender } from '../config/ChatLogics'
import { getSenderFull } from '../config/ChatLogics'
import ProfileModal from './miscellaneous/ProfileModal'
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import './styles.css';
import ScrollableChat from './ScrollableChat';
import Lottie from 'react-lottie'
import animationData from "../animations/typing.json";
import Picker from 'emoji-picker-react'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton
} from '@chakra-ui/react'

import io from "socket.io-client"
const ENDPOINT = "https://chatterbox-dhsv.onrender.com";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {

    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [newMessage, setNewMessage] = useState("")
    const toast = useToast();
    const [socketConnected, setSocketConnected] = useState(false)
    const [typing, setTyping] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [showPicker, setShowPicker] = useState(false)

    const { user, selectedChat, setSelectedChat, notification, setNotification } = ChatState();

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice"
        }
    }

    const fetchMessages = async () => {
        if (!selectedChat) return

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }

            setLoading(true)
            const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
            setMessages(data)
            setLoading(false)

            socket.emit('join chat', selectedChat._id)
        } catch (error) {
            toast({
                title: "Error Occured!",
                description: "failed to load the message ",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            })
        }
    }

    const sendMessage = async (event) => {
        if (event.key === 'Enter' && newMessage) {
            socket.emit('stop typing', selectedChat._id)
            try {
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`
                    }
                }
                setNewMessage("");

                const { data } = await axios.post("api/message", {
                    content: newMessage,
                    chatId: selectedChat
                }, config)


                socket.emit('new message', data)
                setMessages([...messages, data])
            } catch (error) {
                toast({
                    title: "Error Occured!",
                    description: "failed to send the message ",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                })
            }
        }
    }
    const sendMessageHandler = async () => {
        if (newMessage) {
            socket.emit('stop typing', selectedChat._id)
            try {
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`
                    }
                }
                setNewMessage("");
                setShowPicker(false)

                const { data } = await axios.post("api/message", {
                    content: newMessage,
                    chatId: selectedChat
                }, config)


                socket.emit('new message', data)
                setMessages([...messages, data])
            } catch (error) {
                toast({
                    title: "Error Occured!",
                    description: "failed to send the message ",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom",
                })
            }
        }
    }
    useEffect(() => {
        socket = io(ENDPOINT)
        socket.emit("setup", user)
        socket.on('connected', () => setSocketConnected(true))
        socket.on('typing', () => setIsTyping(true))
        socket.on('stop typing', () => setIsTyping(false))
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        fetchMessages();

        selectedChatCompare = selectedChat;
        // eslint-disable-next-line
    }, [selectedChat])

    console.log(notification, "-------------------------")

    useEffect(() => {
        socket.on('message recieved', (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id
            ) {
                if (!notification.includes(newMessageRecieved)) {
                    setNotification([newMessageRecieved, ...notification]);
                    setFetchAgain(!fetchAgain)
                }
            } else {
                setMessages([...messages, newMessageRecieved])
            }
        })
    })





    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;

        if (!typing) {
            setTyping(true)
            socket.emit('typing', selectedChat._id)
        }
        let lastTypingTime = new Date().getTime()
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;

            if (timeDiff >= timerLength && typing) {
                socket.emit('stop typing', selectedChat._id)
                setTyping(false)
            }
        }, timerLength)
    }

    const onEmojiClick = (event, emojiObject) => {
        setNewMessage(prevInput => prevInput + emojiObject.emoji);
    }
    const initRef = React.useRef()


    return (
        <>
            {selectedChat ? (
                <>
                    <Text
                        fontSize={{ base: "28px", md: "30px" }}
                        pb={3}
                        px={2}
                        w="100%"
                        fontFamily="Work sans"
                        display="flex"
                        justifyContent={{ base: "space-between" }}
                        alignItems="center"
                    >
                        <IconButton
                            display={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                        />
                        {messages && !selectedChat.isGroupChat ? (
                            <>
                                {getSender(user, selectedChat.users)}
                                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
                            </>
                        ) : (
                            <>{selectedChat.chatName.toUpperCase()}
                                <UpdateGroupChatModal
                                    fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
                            </>
                        )}
                    </Text>
                    <Box
                        display="flex" flexDir="column" justifyContent="flex-end" p={3} bg="#E8E8E8" w="100%" h="100%" borderRadius="lg" overflow="hidden">
                        {loading ? (
                            <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
                        ) : (
                            <div className="messages">
                                <ScrollableChat messages={messages} />
                            </div>
                        )}
                        <FormControl
                            onKeyDown={sendMessage}
                            id="first-name"
                            isRequired mt={3}>

                            {isTyping ?
                                <div>
                                    <Lottie
                                        options={defaultOptions}
                                        width={70}
                                        style={{ marginBottom: 15, marginLeft: 0 }} /></div>
                                : <></>}
                                 <Popover
                                placement='top-start' 
                                initialFocusRef={initRef}>
                                    {({ isOpen, onClose }) => (
        <>
        {!isOpen && setShowPicker(false)}
                                <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverCloseButton />
                                    <PopoverBody>
                                        {showPicker && <Picker pickerStyle={{ width: '100%' }} onEmojiClick={onEmojiClick} />}
                                    </PopoverBody>
                                </PopoverContent>

                                <InputGroup>
                                    <InputLeftElement width='2.5rem'>
                                        <PopoverTrigger>
                                            <IconButton onClick={() => setShowPicker(val => !val)} aria-label='Add to friends' icon={isOpen ? <CloseIcon /> : <AddIcon />} size='sm' />
                                            {/* {!isOpen && setShowPicker(false)} */}
                                        </PopoverTrigger>

                                    </InputLeftElement>
                                    <Input
                                        variant="filled" bg="#E0E0E0" placeholder="Enter the message.." onChange={typingHandler} value={newMessage} />
                                    <InputRightElement width='4.5rem'>
                                        <Button h='1.75rem' size='md' onClick={sendMessageHandler} >
                                            Send
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                                </>
      )}
                                </Popover>
                        </FormControl>

                    </Box>
                </>
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" h="100%">
                    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
                        Click on a user to start chatting
                    </Text>

                </Box>
            )}
        </>
    )
}

export default SingleChat