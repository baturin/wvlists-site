function stripPrefix(str, prefix)
{
    if (str.lastIndexOf(prefix, 0) === 0) {
        return str.substr(prefix.length);
    } else {
        return null;
    }
}

function splitWithTail(str, delim, count){
    var parts = str.split(delim);
    var tail = parts.slice(count).join(delim);
    var result = parts.slice(0, count);
    result.push(tail);
    return result;
}