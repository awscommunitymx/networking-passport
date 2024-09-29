import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Divider,
    Heading,
    HStack,
    Icon,
    Skeleton,
    SkeletonText,
    Text,
    useColorModeValue,
    VStack
} from '@chakra-ui/react';
import {BriefcaseIcon, DownloadIcon, GlobeIcon, LinkedinIcon, Mail, PhoneIcon} from 'lucide-react';
import {Profile} from "../types/profile.ts";

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

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const cardBgColor = useColorModeValue('white', 'gray.700');

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await simulateAPICall();
            setProfile(data);
            setIsLoading(false);
        }
        fetchProfile();
    }, []);

    const downloadVCF = () => {
        alert('Downloading VCF file...');
    };

    const ProfileItem: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({icon, label, value}) => (
        <HStack>
            <Icon as={icon} color="blue.500"/>
            <Text fontWeight="bold">{label}:</Text>
            {isLoading ? <Skeleton height="20px" width="150px"/> : <Text>{value}</Text>}
        </HStack>
    );

    return (
        <Box bg={bgColor} minHeight="100vh" py={10}>
            <Container maxW="container.md">
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
                        <ProfileItem icon={BriefcaseIcon} label="Company" value={profile?.company || ''}/>
                        <ProfileItem icon={Mail} label="Email" value={profile?.email || ''}/>
                        <ProfileItem icon={PhoneIcon} label="Phone" value={profile?.phone || ''}/>
                        <ProfileItem icon={GlobeIcon} label="Website" value={profile?.website || ''}/>
                        <ProfileItem icon={LinkedinIcon} label="LinkedIn" value={profile?.linkedin || ''}/>
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