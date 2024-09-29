import {useEffect, useState} from "react";
import {Box, HStack, Text} from "@chakra-ui/react";
import Cookies from 'js-cookie';

const NavBar = () => {
    const [sponsorName, setSponsorName] = useState<string>('');

    const getSponsorName = async (token: string) => {
        // TODO: Fetch sponsor name from the server
        return token;
    }

    useEffect(() => {
        const sponsorToken = Cookies.get('sponsorToken');
        if (sponsorToken) {
            getSponsorName(sponsorToken).then((name) => setSponsorName(name))
        }
    });

    return (
        <Box bg="blue.500" color="white" p={4}>
            <HStack spacing={4}>
                <Text>Vista de patrocinador</Text>
                <b>{sponsorName}</b>
            </HStack>
        </Box>
    );
}

export default NavBar;