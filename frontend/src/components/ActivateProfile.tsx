import NavBar from "./NavBar.tsx";
import {
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Switch,
    useToast,
    VStack
} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import {ValidationResponse} from "../types/validation.ts";
import BASE_API_URL from "../base-api.ts";
import axios from "axios";
import {useNavigate} from "react-router-dom";

interface SocialLink {
    name: string;
    url: string;
}

interface ProfileData {
    short_id?: string;
    unlock_key?: string;
    company: string;
    email?: string;
    first_name: string;
    last_name: string;
    role: string;
    social_links: SocialLink[];
}

interface UserProfile {
    short_id: string;
    unlock_key: string;
    company: string;
    email: string;
    phone: string;
    share_email: boolean;
    share_phone: boolean;
    pin: string;
    social_links: SocialLink[];
    gender: string;
    age_range: string;
    area_of_interest: string;
}

const ActivateProfile = () => {
    const [shortID, setShortID] = useState('');
    const [method, setMethod] = useState<'both' | 'email'>('both');
    const [unlockValue, setUnlockValue] = useState('');
    const [unlockKey, setUnlockKey] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const navigate = useNavigate();
    const toast = useToast();

    const prepopulateProfile = async (unlockKey: string) => {
        const response = await axios.get<ProfileData>(`${BASE_API_URL}/attendee?short_id=${shortID}&unlock_key=${unlockKey}`);
        setUserProfile({
            short_id: shortID,
            unlock_key: unlockKey,
            company: response.data.company,
            email: response.data.email || '',
            phone: '',
            share_email: false,
            share_phone: false,
            pin: '',
            social_links: response.data.social_links,
            gender: '',
            age_range: '',
            area_of_interest: ''
        });
    }

    const getUnlockKey = async () => {
        const response = await axios.get(`${BASE_API_URL}//attendee/activate?short_id=${shortID}&value=${unlockValue}`, {});
        if (response.status !== 200) {
            toast({
                title: 'Error',
                description: 'La autenticación falló',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
        setUnlockKey(response.data.unlock_key);
        prepopulateProfile(response.data.unlock_key);
    }

    useEffect(() => {
        const fetchActivationStatus = async (): Promise<ValidationResponse> => {
            const response = await axios.get<ValidationResponse>(`${BASE_API_URL}/attendee/validate?short_id=${shortID}`);
            return response.data;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const short_id = urlParams.get('short_id');
        if (short_id) {
            setShortID(short_id);
        }
        fetchActivationStatus().then((response) => {
                if (!response.initialised) {
                    navigate(`/activate?short_id=${short_id}&method=${response.method}`);
                }
                setMethod(response.method);
            }
        );
    }, [navigate, shortID]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the updated profile to your backend
        console.log("Submitting profile:", userProfile);
        // Add your submission logic here
    };

    return (
        <>
            <NavBar/>
            <Container>
                <Heading>Activate Profile</Heading>
                <Modal isOpen={unlockKey === ""} onClose={() => {
                }}>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Autenticate para inicializar este perfil</ModalHeader>
                        <ModalBody>
                            <p>Para inicializar este perfil, necesitas autenticarte.</p>
                            <p>Ingresa tu
                                correo {method === "both" && "o los úlimos 6 dígitos de tu numero telefónico"}:</p>
                            <Input type={"text"} value={unlockValue} onChange={(e) => {
                                setUnlockValue(e.target.value);
                            }}/>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={getUnlockKey}>
                                Inicializar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {userProfile && (
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>Company</FormLabel>
                                <Input name="company" value={userProfile.company} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input name="email" value={userProfile.email} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Phone</FormLabel>
                                <Input name="phone" value={userProfile.phone} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="share_email" mb="0">
                                    Share Email
                                </FormLabel>
                                <Switch id="share_email" name="share_email" isChecked={userProfile.share_email}
                                        onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="share_phone" mb="0">
                                    Share Phone
                                </FormLabel>
                                <Switch id="share_phone" name="share_phone" isChecked={userProfile.share_phone}
                                        onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>PIN</FormLabel>
                                <Input name="pin" value={userProfile.pin} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Gender</FormLabel>
                                <Input name="gender" value={userProfile.gender} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Age Range</FormLabel>
                                <Input name="age_range" value={userProfile.age_range} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Area of Interest</FormLabel>
                                <Input name="area_of_interest" value={userProfile.area_of_interest}
                                       onChange={handleInputChange}/>
                            </FormControl>
                            <Button type="submit" colorScheme="blue">
                                Save Profile
                            </Button>
                        </VStack>
                    </form>
                )}
            </Container>
        </>
    );
};

export default ActivateProfile;