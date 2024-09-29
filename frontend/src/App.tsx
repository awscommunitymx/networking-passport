import ProfilePage from "./components/ProfilePage.tsx";
import {ChakraProvider} from "@chakra-ui/react";

function App() {

    return (
        <ChakraProvider>
            <ProfilePage/>
        </ChakraProvider>
    )
}

export default App
