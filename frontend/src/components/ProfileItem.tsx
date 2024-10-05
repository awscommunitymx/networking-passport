import React from "react";
import {Flex, HStack, Icon, Link, Skeleton, Text} from "@chakra-ui/react";


const ProfileItem: React.FC<{ icon: React.ElementType; label: string; value: string, isLoading: boolean }> = ({
                                                                                                                  icon,
                                                                                                                  label,
                                                                                                                  value,
                                                                                                                  isLoading
                                                                                                              }) => {
    const calculateLink = () => {
        if (label === "Email") {
            return `mailto:${value}`;
        }
        if (label === "Teléfono") {
            return `tel:${value}`;
        }
        return value;
    }

    const calculateValue = () => {
        if (label === "LinkedIn") {
            return value.replace("https://www.linkedin.com", "");
        }
        return value;
    }

    return (
        <HStack>
            <Icon as={icon} color="blue.500"/>
            <Text fontWeight="bold">{label}:</Text>
            {isLoading ? <Skeleton height="20px" width="150px"/> :
                // <a href={calculateLink()} target="_blank" rel="noreferrer">
                <Link href={calculateLink()} isExternal>
                    <Flex wrap={"wrap"}>
                        {calculateValue()}
                    </Flex>
                </Link>
            }
        </HStack>
    )
};

export default ProfileItem;