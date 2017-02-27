import numpy as np
from Graph import Graph


class Patient(object):
    def __init__(self, p_id):
        self.id = p_id

        self.left_graph = None
        self.right_graph = None
        self.tumor_position = ""
        self.gender = ""
        self.lymph_nodes = []

    def set_lymph_nodes(self, lymph_nodes):
        self.lymph_nodes = lymph_nodes

    def set_graphs(self, left_graph, right_graph):
        self.left_graph = left_graph
        self.right_graph = right_graph

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

    def get_all_nodes(self):
        return self.left_graph.get_nodes() + self.right_graph.get_nodes()

    def get_all_unique_nodes(self):
        return list(set(self.left_graph.get_nodes() + self.right_graph.get_nodes()))

    def get_tumor_position(self):
        return self.tumor_position

    def get_gender(self):
        return self.gender

    def get_vector(self):
        left_nodes = self.left_graph.get_nodes()
        right_nodes = self.right_graph.get_nodes()

        vector = np.zeros(len(self.lymph_nodes))

        for l in range(len(self.lymph_nodes)):
            if self.lymph_nodes[l] in left_nodes:
                vector[l] += 1

            if self.lymph_nodes[l] in right_nodes:
                vector[l] += 1

        return vector
