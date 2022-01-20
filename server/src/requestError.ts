export type RequestError = {
    errorMessage: string;
    MediaTrackerError: true;
};

export const toRequestErrorObject = (message: string): RequestError => {
    return {
        errorMessage: message,
        MediaTrackerError: true,
    };
};
