import numpy as np
from Graph import Graph
import sys
import itertools

class Patient(object):
    def __init__(self, p_id):
        self.id = p_id

        self.left_graph = None
        self.right_graph = None
        self.tumor_position = ""
        self.gender = ""
        self.lymph_nodes = []
        self.adjacency_matrix = []

    def set_lymph_nodes(self, lymph_nodes):
        self.lymph_nodes = lymph_nodes

    def set_graphs(self, left_graph, right_graph):

        self.left_graph = left_graph
        self.right_graph = right_graph

        for node in self.left_graph.get_nodes():
            row = self.lymph_nodes.index(node)
            for idx, col in enumerate(self.adjacency_matrix[row]):
                neighbor = self.lymph_nodes[idx]
                # check for the connecting edges
                if node == neighbor and (node == '6' or node == '1a'):
                    self.left_graph.set_edge(node, node)

                elif int(col) == 1 and node != neighbor:
                    self.left_graph.set_edge(node, neighbor)

        for node in self.right_graph.get_nodes():
            row = self.lymph_nodes.index(node)
            for idx, col in enumerate(self.adjacency_matrix[row]):
                neighbor = self.lymph_nodes[idx]

                # check for the connecting edges
                if node == neighbor and (node == '6' or node == '1a'):
                    self.right_graph.set_edge(node, node)

                elif int(col) == 1 and node != neighbor:
                    self.right_graph.set_edge(node, neighbor)

    def set_adjacency_matrix(self, matrix):
        self.adjacency_matrix = matrix

    def set_gender(self, gender):
        self.gender = gender

    def set_tumor_position(self, tumor_position):
        self.tumor_position = tumor_position

    def get_id(self):
        return self.id

    def get_graph(self, position):
        if position == "Right":
            return self.right_graph
        elif position == "Left":
            return self.left_graph

    def get_combined_left_nodes(self):
        left_nodes = self.left_graph.get_nodes()
        nodes_left = []
        included_left = []
        for s in list(itertools.combinations(left_nodes,2)):
            # the two nodes are connected
            n1 = self.lymph_nodes.index(s[0])
            n2 = self.lymph_nodes.index(s[1])

            if int(self.adjacency_matrix[n1][n2]) == 1:
                nodes_left.append(s[0] + s[1])

                if s[0] not in included_left:
                    included_left.append(s[0])
                if s[1] not in included_left:
                    included_left.append(s[1])

        for l in left_nodes:
            if l not in included_left:
                nodes_left.append(l)

        return nodes_left

    def get_combined_right_nodes(self):
        right_nodes = self.right_graph.get_nodes()
        nodes_right = []
        included_right = []
        for s in list(itertools.combinations(right_nodes,2)):
            # the two nodes are connected
            n1 = self.lymph_nodes.index(s[0])
            n2 = self.lymph_nodes.index(s[1])

            if int(self.adjacency_matrix[n1][n2]) == 1:
                nodes_right.append(s[0]+s[1])

                if s[0] not in included_right:
                    included_right.append(s[0])
                if s[1] not in included_right:
                    included_right.append(s[1])

        for r in right_nodes:
            if r not in included_right:
                nodes_right.append(r)

        return nodes_right

    def get_all_combined_nodes(self):
        return sorted(self.get_combined_left_nodes() + self.get_combined_right_nodes())

    def get_all_nodes(self):
        return sorted(self.right_graph.get_nodes() + self.left_graph.get_nodes())

    def get_all_edges(self):
        return list(self.right_graph.get_edges().keys() + self.left_graph.get_edges().keys())

    def get_all_unique_edges(self):
        return list( set(self.right_graph.get_edges().keys() + self.left_graph.get_edges().keys()) )

    def get_all_unique_nodes(self):
        return list(set(self.left_graph.get_nodes() + self.right_graph.get_nodes()))

    def get_tumor_position(self):
        return self.tumor_position

    def get_gender(self):
        return self.gender

    def get_nodes_vector(self, common_nodes):
        left_nodes = self.get_combined_left_nodes()
        right_nodes = self.get_combined_right_nodes()

        vector = np.zeros(len(common_nodes))

        for l in range(len(common_nodes)):
            if common_nodes[l] in left_nodes:
                vector[l] += 1

            if common_nodes[l] in right_nodes:
                vector[l] += 1

        return vector

    def get_edges_vector(self, common_edges):

        left_edges = self.left_graph.get_edges()
        right_edges = self.right_graph.get_edges()

        vector = np.zeros(len(common_edges))

        for l in range(len(common_edges)):
            if common_edges[l] in left_edges:
                vector[l] += left_edges[common_edges[l]]

            if common_edges[l] in right_edges:
                vector[l] += right_edges[common_edges[l]]

        # if self.id == 1:
        #     print self.id
        #     print left_edges
        #     print right_edges
        #     print common_edges
        #     print vector
        #     print
        #
        # if self.id == 136:
        #     print self.id
        #     print left_edges
        #     print right_edges
        #     print common_edges
        #     print vector
        #     sys.exit()

        return vector
