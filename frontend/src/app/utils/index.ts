const getShortFileName = (filename: string): string => {
    // Split filename by hyphen to get the part without timestamp
    const parts = filename.split('-');
    
    // If there is a timestamp at the beginning (standard format), remove it
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      // Remove the first part (timestamp) and join the remaining parts
      return parts.slice(1).join('-');
    }
    
    // If not in the right format or no timestamp, return the original name
    return filename;
}

export { getShortFileName };