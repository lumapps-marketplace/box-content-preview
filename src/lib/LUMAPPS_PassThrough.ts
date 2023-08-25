import axios from 'axios';
// eslint-disable-next-line prettier/prettier
import type { LumAppsContext, PassThroughData } from './LUMAPPS_types';


const lumappsPassThrough = async (
    LumAppsContext: LumAppsContext,
    connectorId: string,
    PassThroughData: PassThroughData,
) => {
    const { baseUrl, haussmannCell, organizationId, token } = LumAppsContext;

    return axios.post(
        `${haussmannCell}/v2/organizations/${organizationId}/integrations/box/connectors/${connectorId}/call?baseUrl=${baseUrl}`,
        PassThroughData,
        {headers: {Authorization: `Bearer ${token}`}},
    )
};
export default lumappsPassThrough
