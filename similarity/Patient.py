import numpy as np
from Graph import Graph

class Patient(object):

    def __init__(self, id):
        self.id = id

        self.left_graph = None
        self.right_graph = None
        self.tumor_position = ""
        self.gender = ""


    def set_lymph_nodes(self, lymph_nodes):
        self.lymph_nodes = lymph_nodes


    def set_graphs(self, leftGraph, rightGraph):
        self.left_graph = leftGraph
        self.right_graph = rightGraph


    def set_gender(self, gender):
        self.gender = gender


    def set_tumor_position(self, tumorPosition):
        self.tumor_position = tumorPosition


    def get_id(self):
        return self.id


    def get_graph(self, position):
        if position == "Right":
            return self.right_graph
        elif position == "Left":
            return self.left_graph


    def get_all_nodes(self):
        return self.left_graph.get_nodes() + self.right_graph.get_nodes()


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
