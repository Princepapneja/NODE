export function getTimeStringBefore(minutes, isoTimeString) {
    // Parse the ISO time string
    const date = new Date(isoTimeString);

    // Subtract the specified number of minutes
    date.setMinutes(date.getMinutes() - minutes);

    // Format the date and time to ISO 8601 format
    const isoStringBefore = date.toISOString();

    return isoStringBefore;
}
