import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Divider,
    Heading,
    Skeleton,
    SkeletonText,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react';
import {BriefcaseIcon, DownloadIcon, GlobeIcon, LinkedinIcon, Mail, PhoneIcon} from 'lucide-react';
import {Profile} from "../types/profile.ts";
import Cookies from 'js-cookie';
import NavBar from "./NavBar.tsx";
import ProfileItem from "./ProfileItem.tsx";

const simulateAPICall = (): Promise<Profile> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                name: 'John Doe',
                position: 'Senior Software Engineer',
                company: 'Tech Innovations Inc.',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                website: 'www.johndoe.com',
                linkedin: 'linkedin.com/in/johndoe'
            });
        }, 5000);
    });
};

const simulateRegisterVisit = (): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Math.random() > 0.5); // Simulates a 50% success rate
        }, 2000);
    });
};

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSponsor, setIsSponsor] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const toast = useToast();
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const cardBgColor = useColorModeValue('white', 'gray.700');

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await simulateAPICall();
            setProfile(data);
            setIsLoading(false);
        }
        fetchProfile();

        // Check for sponsor token cookie
        const sponsorToken = Cookies.get('sponsorToken');
        setIsSponsor(!!sponsorToken);
    }, []);

    const downloadVCF = () => {
        alert('Downloading VCF file...');
    };

    const registerVisit = async () => {
        setIsRegistering(true);
        const success = await simulateRegisterVisit();
        setIsRegistering(false);

        toast({
            title: success ? 'Visita registrada' : 'Error',
            description: success ? 'Se ha registrado la visita al stand con éxito' : 'Ha ocurrido un error al registrar la visita',
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });
    };


    return (
        <Box bg={bgColor} minHeight="100vh">
            {isSponsor && (
                <NavBar/>
            )}

            <Container maxW="container.md" py={10}>
                {isSponsor && (
                    <Button
                        colorScheme="green"
                        onClick={registerVisit}
                        isLoading={isRegistering}
                        mb={6}
                        width="100%"
                    >
                        Register Visit
                    </Button>
                )}

                <VStack
                    spacing={6}
                    align="stretch"
                    bg={cardBgColor}
                    p={8}
                    borderRadius="lg"
                    boxShadow="xl"
                >
                    {isLoading ? (
                        <Skeleton height="40px" width="200px" alignSelf="center"/>
                    ) : (
                        <Heading size="xl" textAlign="center">{profile?.name}</Heading>
                    )}

                    {isLoading ? (
                        <SkeletonText noOfLines={1} skeletonHeight="4" width="150px" alignSelf="center"/>
                    ) : (
                        <Text fontSize="lg" color="gray.500" textAlign="center">{profile?.position}</Text>
                    )}

                    <Divider/>

                    <VStack align="stretch" spacing={4}>
                        <ProfileItem icon={BriefcaseIcon} label="Company" value={profile?.company || ''}
                                     isLoading={isLoading}/>
                        <ProfileItem icon={Mail} label="Email" value={profile?.email || ''} isLoading={isLoading}/>
                        <ProfileItem icon={PhoneIcon} label="Phone" value={profile?.phone || ''} isLoading={isLoading}/>
                        <ProfileItem icon={GlobeIcon} label="Website" value={profile?.website || ''}
                                     isLoading={isLoading}/>
                        <ProfileItem icon={LinkedinIcon} label="LinkedIn" value={profile?.linkedin || ''}
                                     isLoading={isLoading}/>
                    </VStack>

                    <Button
                        leftIcon={<DownloadIcon/>}
                        colorScheme="blue"
                        onClick={downloadVCF}
                        size="lg"
                        mt={4}
                        isLoading={isLoading}
                    >
                        Download VCF
                    </Button>
                </VStack>
            </Container>
        </Box>
    );
};

export default ProfilePage;