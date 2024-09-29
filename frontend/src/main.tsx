import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import ProfilePage from "./components/ProfilePage.tsx";
import {ChakraProvider} from "@chakra-ui/react";
import SponsorPage from "./components/SponsorPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <ProfilePage/>,
    },
    {
        path: "/sponsor",
        element: <SponsorPage/>,
    }
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ChakraProvider>
            <RouterProvider router={router}/>
        </ChakraProvider>
    </StrictMode>,
)
