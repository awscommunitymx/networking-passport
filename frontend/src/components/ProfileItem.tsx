import React from "react";
import {HStack, Icon, Skeleton, Text} from "@chakra-ui/react";

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

    return (
        <HStack>
            <Icon as={icon} color="blue.500"/>
            <Text fontWeight="bold">{label}:</Text>
            {isLoading ? <Skeleton height="20px" width="150px"/> :
                <a href={calculateLink()} target="_blank" rel="noreferrer">
                    <Text>{value}</Text>
                </a>
            }

        </HStack>
    )
};

export default ProfileItem;