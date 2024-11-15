export interface Profile {
    first_name: string;
    last_name: string;
    role: string;
    company: string;
    social_links: { name: string; url: string }[];
    vcard: string;
    email?: string;
    phone?: string;
}

export const availableSocialLinks = [
    "LinkedIn",
    "GitHub",
    "Instagram",
];
