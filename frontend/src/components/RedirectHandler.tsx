import React, {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Box, Center, Spinner} from '@chakra-ui/react';

const RedirectHandler: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleRedirect = () => {
            const searchParams = new URLSearchParams(location.search);
            const shortId = searchParams.get('short_id');


            // Check if the sponsorToken cookie exists
            const sponsorToken = localStorage.getItem('sponsorToken');

            if (sponsorToken) {
                // If the cookie exists, redirect to search-participant
                navigate(`/search-participant?short_id=${shortId}`);
            } else {
                // If the cookie doesn't exist, redirect to unlock-profile
                navigate(`/view-profile?short_id=${shortId}`);
            }
        };

        handleRedirect();
    }, [navigate, location]);

    return (
        <Box height="100vh">
            <Center height="100%">
                <Spinner size="xl"/>
            </Center>
        </Box>
    );
};

export default RedirectHandler;