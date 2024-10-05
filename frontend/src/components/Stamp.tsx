import React from "react";
import {Image} from "@chakra-ui/react";

const Stamp: React.FC<{ stampID: string, stampedIDs: string[] }> = ({stampID, stampedIDs}) => {
    return (
        <Image
            src={`/${stampedIDs.includes(stampID) ? "stamped" : "offline"}/${stampID}.png`}
        />
    )
}

export default Stamp;