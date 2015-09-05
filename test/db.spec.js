import _ from "lodash";
import * as db from "kitsune/db";
import { expect } from "chai";

describe("kitsune/db", function() {

	describe("createNode(type)", function() {
		it("should create a \"type\" node", function(done) {
			db.createNode(db.core.node)
				.then(function(id) {
					expect(id).to.not.equal(null);
				})
				.then(done, done);
		});

		it("should create a generic node by default (no args)", function(done) {
			db.createNode()
				.then(db.getType)
				.then(function(type) {
					expect(type).to.equal(db.core.node);
				})
				.then(done, done);
		});
	});

	describe("createNodes(count, type)", function() {
		it("should create multiple \"type\" nodes (default generic type)", function(done) {
			db.createNodes(5)
				.then(function(nodes) {
					expect(nodes).to.have.length(5);
				})
				.then(done, done);
		});
	});

	describe("create(type, data)", function() {
		it("should save a node with it's type and data", function(done) {

			db.create(db.core.string, { string: "Super power" })
				.then(db.getType)
				.then(function(type) {
					expect(type).to.equal(db.core.string);
				})
				.then(done, done);

		});
	});

	describe("relate(head, tail)", function() {
		it("should create a generic relationship between two nodes", function(done) {

			db.createNodes(2)
				.then(function(nodes) {
					return db.relate(nodes[0], nodes[1]);
				})
				.then(db.getType)
				.then(function(type) {
					expect(type).to.equal(db.core.relationship);
				})
				.then(done, done);
		});

		it("should create multple relationships if an array is passed to tail", function(done) {
			db.createNodes(3)
				.then(function(nodes) {
					var [ parent, childA, childB ] = nodes;
					return db.relate(parent, [childA, childB]);
				})
				.then(function(relationshipIds) {
					expect(relationshipIds).to.have.length(2);
				})
				.then(done, done);
		});
	});

	describe("rels(node, type)", function() {
		it("should return an array of all relationships", function(done) {

			var nodeA, nodeB, nodeC;
			db.createNodes(3)
				.then(function(nodes) {

					[ nodeA, nodeB, nodeC ] = nodes;

					return Promise.all([
						db.relate(nodeA, nodeB),
						db.relate(nodeA, nodeC)
					]);
				})
				.then(function() {
					return db.rels(nodeA);
				})
				.then(function(relatedNodes) {
					var nodeIds = _.pluck(relatedNodes, "tail");
					expect(nodeIds).to.have.members([nodeB, nodeC]);
					expect(nodeIds).to.have.length(2);
				})
				.then(done, done);
		});

		it("should return an array of all relationships in either direction", function(done) {

			var nodeA, nodeB, nodeC;
			db.createNodes(3)
				.then(function(nodes) {

					[ nodeA, nodeB, nodeC ] = nodes;

					return Promise.all([
						db.relate(nodeA, nodeB),
						db.relate(nodeC, nodeA)
					]);
				})
				.then(function() {
					return db.rels(nodeA);
				})
				.then(function(relatedNodes) {
					var nodeIds = _.map(relatedNodes, _.partial(db.otherNode, nodeA));
					expect(nodeIds).to.have.members([nodeB, nodeC]);
					expect(nodeIds).to.have.length(2);
				})
				.then(done, done);
		});

		it("should return an array of all relationships that match \"type\"", function(done) {

			var parent, typeA, typeB, genericChild, typeAChild, typeAChild2, typeBChild, typeABChild;
			db.createNodes(8)
				.then(function(nodes) {
					[ parent, typeA, typeB, genericChild, typeAChild, typeAChild2, typeBChild, typeABChild ] = nodes;
					return Promise.all([
						db.relate(parent, genericChild),

						db.relate(parent, typeAChild, typeA),
						db.relate(parent, typeBChild, typeB),

						db.relate(parent, typeAChild2, typeA),

						db.relate(parent, typeABChild, typeA),
						db.relate(parent, typeABChild, typeB)
					]);
				})
				.then(function() {
					return db.rels(parent, typeA);
				})
				.then(function(rels) {
					var tails = _.pluck(rels, "tail");
					expect(tails).to.have.members([typeAChild, typeAChild2, typeABChild]);
					expect(tails).to.have.length(3);
				})
				.then(done, done);
		});
	});
});
