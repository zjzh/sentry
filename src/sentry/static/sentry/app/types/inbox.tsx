import {UpdateResolutionStatus} from '.';

export type InboxArg = {inbox: boolean};

export type UpdateFuncArgs = {isBookmarked: boolean} | InboxArg | UpdateResolutionStatus;
