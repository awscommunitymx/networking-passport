import React from "react";
import {HStack, Icon, Skeleton, Text} from "@chakra-ui/react";

const ProfileItem: React.FC<{ icon: React.ElementType; label: string; value: string, isLoading: boolean }> = ({
                                                                                                                  icon,
                                                                                                                  label,
                                                                                                                  value,
                                                                                                                  isLoading
                                                                                                              }) => (
    <HStack>
        <Icon as={icon} color="blue.500"/>
        <Text fontWeight="bold">{label}:</Text>
        {isLoading ? <Skeleton height="20px" width="150px"/> : <Text>{value}</Text>}
    </HStack>
);

export default ProfileItem;