function truncateString(inputString: any, maxLength: Number) {
    if (inputString.length > maxLength) {
        return inputString.substring(0, maxLength) + '...';
    }
    return inputString;
}
export default truncateString