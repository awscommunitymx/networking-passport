import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Divider,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import {BriefcaseIcon, DownloadIcon, GlobeIcon, LinkedinIcon, Mail} from 'lucide-react';
import axios from 'axios';
import ProfileItem from "./ProfileItem.tsx";
import BASE_API_URL from "../base-api.ts";
import NavBar from "./NavBar.tsx";
import Cookies from 'js-cookie';
import {useNavigate} from "react-router-dom";
import {ValidationResponse} from "../types/validation.ts";
import {Profile} from "../types/profile.ts";


const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pin, setPin] = useState('');
    const [isPinModalOpen, setIsPinModalOpen] = useState(true);

    const toast = useToast();
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const cardBgColor = useColorModeValue('white', 'gray.700');

    const [shortID, setShortID] = useState('');

    const navigate = useNavigate();


    useEffect(() => {
        const fetchActivationStatus = async (): Promise<ValidationResponse> => {
            const response = await axios.get<ValidationResponse>(`${BASE_API_URL}/attendee/validate?short_id=${shortID}`);
            return response.data;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const short_id = urlParams.get('short_id');
        console.log(short_id);
        if (short_id) {
            setShortID(short_id);
            console.log("fetching activation status with short_id: ", short_id);
            fetchActivationStatus().then((response) => {
                if (!response.initialized) {
                    navigate(`/activate?short_id=${short_id}&method=${response.method}`);
                }
            });
        }

    }, [navigate, shortID]);

    const fetchProfile = async () => {
        const visitorId = Cookies.get('visitorId');
        setIsLoading(true);
        try {
            const response = await axios.get<Profile>(`${BASE_API_URL}/attendee?short_id=${shortID}&pin=${pin}&device=${visitorId}`);
            setProfile(response.data);
            setIsPinModalOpen(false);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to fetch profile. Please check your PIN and try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handlePinSubmit = () => {
        if (pin.length === 4) {
            fetchProfile();
        } else {
            toast({
                title: 'Invalid PIN',
                description: 'Please enter a 4-digit PIN.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const downloadVCF = () => {
        if (profile?.vcard) {
            const blob = new Blob([profile.vcard], {type: 'text/vcard'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${profile.first_name}_${profile.last_name}.vcf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <>
            <NavBar/>
            <Box bg={bgColor} minHeight="100vh">
                <Container maxW="container.md" py={10}>
                    <VStack
                        spacing={6}
                        align="stretch"
                        bg={cardBgColor}
                        p={8}
                        borderRadius="lg"
                        boxShadow="xl"
                    >
                        {profile ? (
                            <>
                                <Heading size="xl"
                                         textAlign="center">{`${profile.first_name} ${profile.last_name}`}</Heading>
                                <Text fontSize="lg" color="gray.500" textAlign="center">{profile.role}</Text>
                                <Divider/>
                                <VStack align="stretch" spacing={4}>
                                    <ProfileItem icon={BriefcaseIcon} label="Compañia" value={profile.company}
                                                 isLoading={isLoading}/>
                                    {profile.email && (
                                        <ProfileItem icon={Mail} label="Email" value={profile.email}
                                                     isLoading={isLoading}/>
                                    )}
                                    {profile.phone && (
                                        <ProfileItem icon={Mail} label="Teléfono" value={profile.phone}
                                                     isLoading={isLoading}/>
                                    )}
                                    {profile.social_links.map((link, index) => (
                                        <ProfileItem
                                            key={index}
                                            icon={link.name === 'LinkedIn' ? LinkedinIcon : GlobeIcon}
                                            label={link.name}
                                            value={link.url}
                                            isLoading={isLoading}
                                        />
                                    ))}
                                </VStack>
                                <Button
                                    leftIcon={<DownloadIcon/>}
                                    colorScheme="blue"
                                    onClick={downloadVCF}
                                    size="lg"
                                    mt={4}
                                    style={{
                                        whiteSpace: "normal",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    Descargar tarjeta de contacto
                                </Button>
                            </>
                        ) : (
                            <Text textAlign="center">Ingresa el PIN para ver este perfil.</Text>
                        )}
                    </VStack>
                </Container>

                <Modal isOpen={isPinModalOpen} onClose={() => {
                }}>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Ingresa el PIN</ModalHeader>
                        <ModalBody>
                            <Input
                                type="number"
                                placeholder="Ingresa el PIN de 4 dígitos"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={handlePinSubmit}>
                                Enviar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Box>
        </>
    );
};

export default ProfilePage;