import {Input, InputGroup, InputLeftAddon} from "@chakra-ui/react";
import React, {useState} from "react";

const SocialLinkInput: React.FC<{
    socialLink: string,
    handleSocialLinkChange: (name: string, url: string) => void
}> = ({socialLink, handleSocialLinkChange}) => {
    const [value, setValue] = useState('');

    const getLeftAddon = () => {
        if (socialLink === 'LinkedIn') {
            return 'linkedin.com/in/';
        }
        if (socialLink === 'Twitter') {
            return 'twitter.com/';
        }
        if (socialLink === 'GitHub') {
            return 'github.com/';
        }
        if (socialLink === 'Instagram') {
            return 'instagram.com/';
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const leftPart = "https://" + getLeftAddon();
        const leftPartVariation = "https://www." + getLeftAddon();
        let cleanedValue = e.target.value.replace(leftPart, '');
        cleanedValue = cleanedValue.replace(leftPartVariation, '');
        cleanedValue = cleanedValue.replace(/\/$/, "");
        setValue(cleanedValue);
        handleSocialLinkChange(socialLink, leftPart + cleanedValue);
    }

    return (
        <InputGroup size='sm'>

            <InputLeftAddon>
                {getLeftAddon()}
            </InputLeftAddon>
            <Input placeholder={socialLink} onChange={
                handleChange
            }
                   value={value}
            />
        </InputGroup>
    )
}
export default SocialLinkInput;