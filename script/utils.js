function replaceWithDict(str, dict) {
    // keys are already sorted longest → shortest
    const pattern = new RegExp(Object.keys(dict).join("|"), "g");
    while (str.replace(pattern, (match) => dict[match]) !== str)
        str = str.replace(pattern, (match) => dict[match]);
    return str;
}