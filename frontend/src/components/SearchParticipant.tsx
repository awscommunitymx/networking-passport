import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
    Textarea,
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
    notes: string;
    message: string;
    timestamp: string;
}

const SearchParticipant: React.FC = () => {
    const [eventCode, setEventCode] = useState<string>('');
    const [urlReady, setUrlReady] = useState<boolean>(false);
    const [participantData, setParticipantData] = useState<ParticipantData | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    const fetchParticipantData = async (code: string) => {
        const token = localStorage.getItem('sponsorToken');
        if (!token) {
            navigate('/sponsor-login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get<ParticipantData>(
                `${BASE_API_URL}/sponsor/passport?short_id=${code}&jwt=${token}`
            );
            setParticipantData(response.data);
            setNotes(response.data.notes || '');
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
        if (shortId && !urlReady) {
            setEventCode(shortId);
            fetchParticipantData(shortId);
            setUrlReady(true);
        }
    }, [fetchParticipantData, location]);


    const handleSearch = () => {
        navigate(`/search-participant?short_id=${eventCode}`);
    };

    const handleRegisterVisit = async () => {
        const token = localStorage.getItem('sponsorToken');
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
                    notes: notes,
                }
            );
            toast({
                title: 'Success',
                description: participantData?.notes ? 'Notes updated' : 'Visit registered',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchParticipantData(eventCode);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to register visit',
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
                            <FormLabel>Event Code</FormLabel>
                            <Input
                                value={eventCode}
                                onChange={(e) => setEventCode(e.target.value)}
                                placeholder="Enter event code"
                            />
                        </FormControl>
                        <Button onClick={handleSearch} isLoading={isLoading}>
                            Search
                        </Button>

                        {participantData && (
                            <>
                                <Text fontSize="xl" fontWeight="bold">
                                    {participantData.first_name} {participantData.last_name}
                                </Text>
                                <FormControl>
                                    <FormLabel>Notes</FormLabel>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Enter notes"
                                    />
                                </FormControl>
                                <Button
                                    onClick={handleRegisterVisit}
                                    isLoading={isLoading}
                                >
                                    {participantData.message === "Already stamped" ? "Modify notes" : "Register Visit"}
                                </Button>
                                {participantData.message === "Already stamped" && (
                                    <Text color="red.500">Code scanned previously</Text>
                                )}
                                {participantData.timestamp && (
                                    <Text>Last scanned: {new Date(participantData.timestamp).toLocaleString()}</Text>
                                )}
                            </>
                        )}
                    </VStack>
                </Box>
            </Container>
        </>
    );
};

export default SearchParticipant;