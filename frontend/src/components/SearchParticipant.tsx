import React, {useEffect, useRef, useState} from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
    useToast,
    VStack
} from '@chakra-ui/react';
import {useLocation, useNavigate} from 'react-router-dom';
import axios from 'axios';
import BASE_API_URL from "../base-api.ts";
import NavBar from "./NavBar.tsx";

interface ParticipantData {
    first_name: string;
    last_name: string;
    role: string;
    company: string;
}

const SearchParticipant: React.FC = () => {
    const [eventCode, setEventCode] = useState<string>('');
    const [urlReady, setUrlReady] = useState<boolean>(false);
    const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const visitRegistered = useRef(false);

    const fetchParticipantData = async (code: string) => {
        const token = localStorage.getItem('sponsorToken');
        if (!token) {
            navigate('/sponsor-login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get<ParticipantData>(
                `${BASE_API_URL}/sponsor/passport?short_id=${code.toUpperCase()}&jwt=${token}`
            );
            setParticipantData(response.data);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to fetch participant data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('sponsorToken');
        if (!token) {
            navigate('/sponsor-login');
            return;
        }

        const params = new URLSearchParams(location.search);
        const shortId = params.get('short_id');
        if (shortId && !visitRegistered.current) {
            setEventCode(shortId);
            handleRegisterVisit(token, shortId);
            visitRegistered.current = true;
            setUrlReady(true);
        }
    }, [location]);


    const handleSearch = () => {
        setUrlReady(false);
        setParticipantData(null);
        navigate(`/search-participant?short_id=${eventCode}`);
    };

    const handleRegisterVisit = async (token: string, eventCode: string) => {
        if (!token) {
            navigate('/sponsor-login');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(
                `${BASE_API_URL}/sponsor/passport`,
                {
                    short_id: eventCode,
                    jwt: token,
                }
            );
            toast({
                title: 'Success',
                description: 'Visit registered',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchParticipantData(eventCode);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to register visit. Maybe the participant has already visited this session?',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <NavBar/>
            <Container>
                <Heading>
                    Search Participant
                </Heading>
                <Box maxWidth="600px" margin="auto" mt={8}>
                    <VStack spacing={4} align="stretch">
                        <FormControl>
                            <FormLabel>
                                Participant Code
                                <Text fontSize='xs' color="gray">You can find the participant code under the QR
                                    code.</Text>
                            </FormLabel>
                            <Input
                                value={eventCode}
                                onChange={(e) => setEventCode(e.target.value)}
                                placeholder="Enter participant code"
                            />
                        </FormControl>
                        <Button onClick={handleSearch} isLoading={isLoading}>
                            Search
                        </Button>

                        {participantData && (
                            <>
                                <Box>
                                    <Text fontSize="xl" fontWeight="bold">
                                        {participantData.first_name} {participantData.last_name}
                                    </Text>
                                    <Text>
                                        {participantData.role}
                                    </Text>
                                    <Text><b>{participantData.company}</b></Text>
                                </Box>
                            </>
                        )}
                    </VStack>
                </Box>
            </Container>
        </>
    );
};

export default SearchParticipant;