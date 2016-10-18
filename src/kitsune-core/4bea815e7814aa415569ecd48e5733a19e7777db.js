function describe({ node, types }) {

    let typeMap = types();

    let result = [];
    for(let key in typeMap) {
        let fn = typeMap[key];
        let isA = fn(node);
        if(isA)
            result.push(key);
    }

    return result;
}
module.exports = describe;