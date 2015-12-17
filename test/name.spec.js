import { expect } from "chai";
import sqlite3 from "sqlite3";

import getDB from "kitsune/systems/db/cache";
import buildNameSys from "kitsune/systems/name";
import bindRelSys from "kitsune/systems/rel";
import bindStringSys from "kitsune/systems/string";
import { createId, logP } from "kitsune/util";

let sqliteDB = getDB();

let relSys = bindRelSys(sqliteDB);
let stringSys = bindStringSys(sqliteDB);

let nameSys = buildNameSys({ relSys, stringSys });

before((done) => sqliteDB.initP.then(() => done(), done));

describe("kitsune/name", function() {

	describe("name(id, nameStr)", function() {
		it("should name the node with provided string", function(done) {
			var id = createId();
			nameSys.name(id, "myName")
				.then(rel => nameSys.getNodes("myName"))
				.then(ids => {
					expect(ids).to.deep.equal([id]);
				})
				.then(done, done);
		});
	});

	describe("getNodes(nameStr)", function() {
		it("should return a list of all nodes that have the name provided", function() {});
	});

	describe("getNames(id)", function() {
		it("should return a list of all names that this node is known by", function(done) {
			var id = createId();

			Promise.all([
				nameSys.name(id, "yourName"),
				nameSys.name(id, "thisName")
			])
				.then(rel => nameSys.getNames(id))
				.then(names => {
					expect(names).to.have.members(["yourName", "thisName"]);
				})
				.then(done, done);
		});
	});
});
