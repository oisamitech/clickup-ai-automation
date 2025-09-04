export default function createFilename(identifier = '', extension) {
    let now = new Date().toISOString().replace(/[:.]/g, '-');
    return `${now}_${identifier}.${extension}`;
}