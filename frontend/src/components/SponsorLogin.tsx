import React, {useState} from 'react';
import {Box, Button, FormControl, FormLabel, Heading, Input, useToast, VStack} from '@chakra-ui/react';
import axios from 'axios';
import BASE_API_URL from "../base-api.ts";

interface LoginResponse {
    token: string;
}

const SponsorLogin: React.FC = () => {
    const [sponsorId, setSponsorId] = useState<string>('');
    const [sponsorKey, setSponsorKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const toast = useToast();

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post<LoginResponse>(
                `${BASE_API_URL}/sponsor/auth`,
                {sponsor_id: sponsorId, sponsor_key: sponsorKey}
            );

            localStorage.setItem('sponsorToken', response.data.token);

            toast({
                title: 'Login successful',
                description: 'You have successfully logged in as a sponsor.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch {
            toast({
                title: 'Login failed',
                description: 'Invalid sponsor ID or key.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box maxWidth="400px" m={8}>
            <Heading>
                Login as Sponsor
            </Heading>
            <VStack spacing={4}>
                <FormControl id="sponsorId" isRequired>
                    <FormLabel>Sponsor ID</FormLabel>
                    <Input
                        type="text"
                        value={sponsorId}
                        onChange={(e) => setSponsorId(e.target.value)}
                    />
                </FormControl>
                <FormControl id="sponsorKey" isRequired>
                    <FormLabel>Sponsor Key</FormLabel>
                    <Input
                        type="password"
                        value={sponsorKey}
                        onChange={(e) => setSponsorKey(e.target.value)}
                    />
                </FormControl>
                <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleLogin}
                    isLoading={isLoading}
                >
                    Login
                </Button>
            </VStack>
        </Box>
    );
};

export default SponsorLogin;