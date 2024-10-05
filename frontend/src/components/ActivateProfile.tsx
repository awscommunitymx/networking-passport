import NavBar from "./NavBar.tsx";
import {
    Button,
    Container,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Switch,
    Text,
    useToast,
    VStack
} from "@chakra-ui/react";
import {useEffect, useState} from "react";
import {ValidationResponse} from "../types/validation.ts";
import BASE_API_URL from "../base-api.ts";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {AddIcon, DeleteIcon, PhoneIcon} from '@chakra-ui/icons';

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
    gender: string;
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
    first_name: string;
    last_name: string;
    role: string;
    profile: string;
}

const genderMap = new Map<string, string>([
    ['male', 'Hombre'],
    ['female', "Mujer"],
    ['other', "Otro"],
]);

const areaOfInterestOptions = [
    "Arquitectura en la nube",
    "DevOps y CI/CD",
    "Serverless",
    "Machine Learning / IA",
    "Big Data y análisis de datos",
    "Contenedores y orquestación",
    "Seguridad en la nube",
    "IoT (Internet de las cosas)",
    "Redes y entrega de contenido",
    "Blockchain",
    "Computación de alto rendimiento (HPC)",
    "Migración a la nube",
    "Desarrollo de aplicaciones móviles y web",
    "FinOps y optimización de costos",
    "Bases de datos"
];

const profiles = [
    "Estudiante",
    "Ingeniero/a con 3 o menos años de experiencia",
    "Ingeniero/a con más de 3 años de experiencia",
    "Buscando reconvertir mi carrera",
    "Otro perfil"
];

const genderOptions = ["Hombre", "Mujer", "Otro"];
const ageRangeOptions = ["18-24", "25-34", "35-44", "45-54", "55+"];

const ActivateProfile = () => {
    const [shortID, setShortID] = useState('');
    const [method, setMethod] = useState<'both' | 'email'>('both');
    const [unlockValue, setUnlockValue] = useState('');
    const [unlockKey, setUnlockKey] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [newSocialLink, setNewSocialLink] = useState<SocialLink>({name: '', url: ''});

    const navigate = useNavigate();
    const toast = useToast();

    const prepopulateProfile = async (unlockKey: string) => {
        const response = await axios.get<ProfileData>(`${BASE_API_URL}/attendee?short_id=${shortID}&unlock_key=${unlockKey}`);
        console.log(response.data)
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
            gender: genderMap.get(response.data.gender) || response.data.gender,
            age_range: '',
            area_of_interest: '',
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            role: response.data.role,
            profile: ''
        });
    }

    const getUnlockKey = async () => {
        console.log("Unlocking profile with value: ", unlockValue);
        try {
            const response = await axios.get(`${BASE_API_URL}/attendee/activate?short_id=${shortID}&value=${unlockValue}`, {});
            setUnlockKey(response.data.unlock_key);
            prepopulateProfile(response.data.unlock_key);
        } catch {
            toast({
                title: 'Error',
                description: 'El dato ingresado no coincide con el registrado, intenta de nuevo.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
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
                if (!response.initialized) {
                    navigate(`/activate?short_id=${short_id}&method=${response.method}`);
                }
                setMethod(response.method);
            }
        );
    }, [navigate, shortID]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const response = await axios.post(`${BASE_API_URL}/attendee`, userProfile)
        if (response.status === 200) {
            toast({
                title: 'Success',
                description: 'Profile saved successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate(`/view-profile?short_id=${shortID}`);
        } else {
            toast({
                title: 'Error',
                description: 'Failed to save profile',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAddSocialLink = () => {
        if (newSocialLink.name && newSocialLink.url && userProfile) {
            setUserProfile({
                ...userProfile,
                social_links: [...userProfile.social_links, newSocialLink]
            });
            setNewSocialLink({name: '', url: ''});
        }
    };

    const handleRemoveSocialLink = (index: number) => {
        if (userProfile) {
            const updatedLinks = userProfile.social_links.filter((_, i) => i !== index);
            setUserProfile({
                ...userProfile,
                social_links: updatedLinks
            });
        }
    };

    return (
        <>
            <NavBar/>
            <Container maxW="container.md" mt={5}>
                <Heading mb={6}>Activar perfil</Heading>
                <Modal isOpen={unlockKey === ""} onClose={() => {
                }}>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Autentícate para inicializar este perfil</ModalHeader>
                        <ModalBody>
                            <p>Para poder compartir tus datos con otros <i>builders</i>, es necesario confirmarlos.</p>
                            <p>Ingresa tu
                                correo
                                electrónico{method === "both" && " o los úlimos 6 dígitos del celular registrado"}:</p>
                            <Input type={"text"} value={unlockValue} onChange={(e) => {
                                setUnlockValue(e.target.value.toLowerCase());
                            }}/>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={getUnlockKey} colorScheme="teal">
                                Inicializar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {userProfile && (
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>Nombre</FormLabel>
                                <Input isDisabled={true} value={`${userProfile.first_name} ${userProfile.last_name}`}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Compañia</FormLabel>
                                <Input isDisabled={true} value={userProfile.company}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Rol</FormLabel>
                                <Input isDisabled={true} value={userProfile.role}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Correo electrónico</FormLabel>
                                <Input name="email" value={userProfile.email} onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="share_email" mb="0">
                                    Compartir correo electrónico
                                </FormLabel>
                                <Switch id="share_email" name="share_email" isChecked={userProfile.share_email}
                                        onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Número de celular</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents='none'>
                                        <PhoneIcon color='gray.300'/>
                                    </InputLeftElement>
                                    <Input type="tel" name="phone" value={userProfile.phone}
                                           onChange={handleInputChange}/>
                                </InputGroup>
                            </FormControl>
                            <FormControl display="flex" alignItems="center">
                                <FormLabel htmlFor="share_phone" mb="0">
                                    Compartir número de celular
                                </FormLabel>
                                <Switch id="share_phone" name="share_phone" isChecked={userProfile.share_phone}
                                        onChange={handleInputChange}/>
                            </FormControl>
                            <FormControl>
                                <FormLabel>PIN</FormLabel>
                                <Input name="pin" value={userProfile.pin} onChange={handleInputChange}/>
                                <FormHelperText>
                                    La clave de 4 dígitos que permitirá a otros <i>builders</i> ver tu perfil.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Género</FormLabel>
                                <Select name="gender" value={userProfile.gender} onChange={handleInputChange}>
                                    <option value="">Selecciona tu género</option>
                                    {genderOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Rango de edad</FormLabel>
                                <Select name="age_range" value={userProfile.age_range} onChange={handleInputChange}>
                                    <option value="">Selecciona tu rango de edad</option>
                                    {ageRangeOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Áreas de mayor interés</FormLabel>
                                <Select name="area_of_interest" value={userProfile.area_of_interest}
                                        onChange={handleInputChange}>
                                    <option value="">
                                        Selecciona tus área de mayor interés
                                    </option>
                                    {areaOfInterestOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Perfil</FormLabel>
                                <Select name="profile" value={userProfile.profile} onChange={handleInputChange}>
                                    <option value="">Selecciona tu perfil</option>
                                    {profiles.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Social Links</FormLabel>
                                {userProfile.social_links.map((link, index) => (
                                    <HStack key={index} mb={2}>
                                        <Text>{link.name}: {link.url}</Text>
                                        <IconButton
                                            aria-label="Remove social link"
                                            icon={<DeleteIcon/>}
                                            onClick={() => handleRemoveSocialLink(index)}
                                            size="sm"
                                        />
                                    </HStack>
                                ))}
                                <HStack>
                                    <Input
                                        placeholder="Platform"
                                        value={newSocialLink.name}
                                        onChange={(e) => setNewSocialLink({...newSocialLink, name: e.target.value})}
                                    />
                                    <Input
                                        placeholder="URL"
                                        value={newSocialLink.url}
                                        onChange={(e) => setNewSocialLink({...newSocialLink, url: e.target.value})}
                                    />
                                    <IconButton
                                        aria-label="Add social link"
                                        icon={<AddIcon/>}
                                        onClick={handleAddSocialLink}
                                    />
                                </HStack>
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