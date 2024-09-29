import React, {useState} from 'react';
import {Box, Button, Container, Heading, Input, useToast, VStack} from '@chakra-ui/react';
import Cookies from 'js-cookie';

// In a real application, this would be stored securely on the server
const PREDEFINED_TOKEN = 'sponsor123token';

const SponsorLogin: React.FC = () => {
    const [token, setToken] = useState('');
    const toast = useToast();

    const handleLogin = () => {
        if (token === PREDEFINED_TOKEN) {
            // Store the token in a cookie that expires in 1 day
            Cookies.set('sponsorToken', token, {expires: 1});

            toast({
                title: 'Login successful',
                description: "You've been successfully logged in.",
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: 'Login failed',
                description: 'Invalid token. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Container maxW="container.sm" centerContent>
            <Box width="100%" p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
                <VStack spacing={4}>
                    <Heading mb={6}>Sponsor Login</Heading>
                    <Input
                        placeholder="Enter your token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        type="password"
                    />
                    <Button colorScheme="blue" onClick={handleLogin} width="100%">
                        Login
                    </Button>
                </VStack>
            </Box>
        </Container>
    );
};

export default SponsorLogin;