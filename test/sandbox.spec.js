import { execSync as exec } from "child_process";
import fs from "fs";

import _ from "lodash";
import { expect } from "chai";

import { Collection } from "lokijs";

import { createId } from "kitsune/util";
import systemLoader from "kitsune-core/31d21eb2620a8f353a250ad2edd4587958faf3b1"; // system-loader
let loader = bind(systemLoader, { path: "kitsune-core" });

describe("sandbox", function() {
    it.only("should have sand in it", function() {

        let systemIds = [
            "844836a52a90135097ca793b6ac249e570229fd8", // init-data

            "fe60fc76f26f8dce6c5f68bbb0ea0c51efef3dff", // loki-collection
            "a73b64eba9daa07051815ca7151ba009789616e2", // graph-autoPut
            "6c877bef62bc8f57eb55265c62e75b36515ef458", // graph-assign
            "4163d1cd63d3949b79c37223bd7da04ad6cd36c8", // graph-factor
            "b7916f86301a6bc2af32f402f6515809bac75b03", // graph-listNodes
            "8f8b523b9a05a55bfdffbf14187ecae2bf7fe87f", // string-autoPut
            "ddfe7d402ff26c18785bcc899fa69183b3170a7d", // name
            "81e0ef7e2fae9ccc6e0e3f79ebf0c9e14d88d266", // getNames

            "d2f544f574dae26adb5ed3ee70c71e302b2575fa", // is-in-collection
        ];

        let systems = systemIds.map(id => loader({ id }));

        let [
            initData,

            lokiColl,
            graphAutoPut,
            graphAssign,
            graphFactor,
            graphListNodes,
            stringAutoPut,
            name,
            getNames,

            isInCollection
        ] = systems;

        let data = initData();
        let { graph, string } = loadData(data, lokiColl);

        // Build systems
        graph.autoPut = bind(graphAutoPut, { graphPut: graph.put });
        graph.assign = bind(graphAssign, { graphAutoPut: graph.autoPut });
        graph.factor = bind(graphFactor, { graphFind: graph.find });
        graph.listNodes = bind(graphListNodes, { graphFind: graph.find });
        string.autoPut = bind(stringAutoPut, { stringPut: string.put });
        name = bind(name, { stringAutoPut: string.autoPut, graphAssign: graph.assign });
        getNames = bind(getNames, { graphFactor: graph.factor, stringFind: string.find });

        let createSystemFile = bind(_createSystemFile, { graphAutoPut: graph.autoPut, nameFn: name });
        let isEdge = bind(isInCollection, { graphFind: graph.find });

        // Execute systems
        // createSystemFile({ name: "is-edge" });
        console.log("Is edge: " + isEdge({ node: "6c3c049ef6f92393570beccc10dd67f2f155377c" }));
        console.log("Is edge: " + isEdge({ node: "d2f544f574dae26adb5ed3ee70c71e302b2575fa" }));

        // System file report
        console.log("=== System File Report ===");
        let coreNodes = fs.readdirSync("node_modules/kitsune-core");
        console.log("System files: "+coreNodes.length);

        let group = graph.find({ where: { head: "66564ec14ed18fb88965140fc644d7b813121c78" } });
        let systemFiles = group.map(x => x.tail).sort();

        let names = getNames({ head: coreNodes });
        names.forEach(value => {
            let isInGroup = systemFiles.indexOf(value.head) != -1;
            console.log("["+(isInGroup ? "X" : " ")+"] "+value.head+": "+JSON.stringify(value.name));
        });

        // Recreate links
        exec("rm -rf src/kitsune-core-src");
        exec("mkdir -p src/kitsune-core-src");
        names.forEach(value => {
            let id = value.head; let name = value.name[0];
            exec("ln -s ../../src/kitsune-core/"+id+" src/kitsune-core-src/"+name);
        });

        // Graph report
        let edges = graph.find();
        let nodes = graph.listNodes();
        let nodePercent = (edges.length/nodes.length*100).toPrecision(4);

        console.log("== Graph Report ==");
        console.log("Nodes: "+nodes.length);
        console.log("Edges: "+edges.length+" ("+nodePercent+"%)");
        console.log("==================");

        // Sort and save Data
        let graphData = _.sortBy(graph.find(), ["head", "tail"]);
        let stringData = _.sortBy(string.find(), ["string"]);
        writeData({ graph: graphData, string: stringData });
    });
});

function _createSystemFile({ graphAutoPut, nameFn, name }) {
    let newSystemId = createId();
    exec("cp src/kitsune-core/ddfe7d402ff26c18785bcc899fa69183b3170a7d src/kitsune-core/"+newSystemId);
    graphAutoPut({ head: "66564ec14ed18fb88965140fc644d7b813121c78", tail: newSystemId });
    nameFn({ head: newSystemId, name: name });
}

function bind(func, bindParams) {
    let f = function(partParams) {
        let fullParams = {};
        for(let key in bindParams)
            fullParams[key] = bindParams[key];

        for(let key in partParams)
            fullParams[key] = partParams[key];

        return func(fullParams);
    };
    return f;
}

function readData(fileName) {
    let data;
    try {
        let json = fs.readFileSync(fileName);
        data = JSON.parse(json);
    } catch(e) {
        data = {
            graph: [],
            string: []
        };
    }
    return data;
}

function loadData(data, lokiColl) {
    let controls = _.mapValues(data, collData => {
        let coll = new Collection();
        let control = _.mapValues(lokiColl(), (func, name) => {
            return bind(func, { db: coll });
        });

        collData.forEach(value => {
            control.put({ element: value });
        });

        return control;
    });
    return controls;
}

function cleanLoki(data) {
    let result = data.map(value => _.omit(value, "meta", "$loki"));
    return result;
}

function wrapData(data) {
    return `var data = function() {
    return ${data};
};
module.exports = data;
`;
}

function writeData(data) {
    data = _.mapValues(data, coll => {
        return cleanLoki(coll);
    });
    let json = JSON.stringify(data, null, 2);
    let finalData = wrapData(json);
    fs.writeFileSync("out.js", finalData);
}

function printTable(graphFind) {
    let table = graphFind();
    table = _.sortBy(table, ["head", "tail"]);
    table.forEach(x => console.log(x.id, x.head, x.tail));
}