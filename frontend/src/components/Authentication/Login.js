
import React, { useState } from 'react'
import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack ,useToast} from '@chakra-ui/react';
import axios from "axios";
import {useHistory} from 'react-router-dom';
import { ChatState } from '../../Context/ChatProvider';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast= useToast();
    const history=useHistory();
    const {user,setUser}=ChatState();


    const handleClick = () => setShow(!show);

    const submitHandler = async () => {
        setLoading(true);
        if (!email || !password) {
            toast({
                title: 'Please fill all the details',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position:"bottom"
              });
              setLoading(false)
              return;
        }
        try {
            const config={
                headers:{
                    "Content-Type":"application/json"
                },
            }
            const {data}=await axios.post("/api/user/login",{email,password},config);
            toast({
                title: 'Login successfull',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position:"bottom"
              });
              localStorage.setItem("userInfo",JSON.stringify(data));
              setLoading(false);
              setUser(data)
              history.push("/chats")
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description:error.response.data.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position:"bottom"
              });
              setLoading(false);
        }
    };

    return (
        <VStack spacing='10px'>
            <FormControl id='email' m='2px' isRequired>
                <FormLabel>Email</FormLabel>
                <Input placeholder='Enter Your Email' type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl id='password' m='2px' isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                    <Input type={show ? "text" : "password"} value={password} placeholder='Enter Your Password' onChange={(e) => setPassword(e.target.value)} />
                    <InputRightElement width='4.5rem'>
                        <Button h='1.75rem' size='sm' onClick={handleClick}>
                            {show ? 'hide' : "show"}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <Button colorScheme='blue' width='100%' style={{ marginTop: 15 }} onClick={submitHandler} isLoading={loading}> Login </Button>
            <Button variant='solid' colorScheme='red' width='100%' style={{ marginTop: 10 }} onClick={() => {
                setEmail("guest@example.com");
                setPassword("123456");
            }}>Get Guest User Credentials  </Button>
        </VStack>
    )
}

export default Login